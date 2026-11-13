import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { AuthProvider, RoleScope, UserStatus } from '../generated/prisma/enums.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { CryptoService } from '../common/services/crypto.service.js';
import type { AppConfig } from '../config/app.config.js';
import type { AuthConfig } from '../config/auth.config.js';
import { EmailService } from '../email/email.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SessionClientMetadata } from '../sessions/sessions.service.js';
import { type AuthTokenBundle, TokenIssuerService } from './token-issuer.service.js';

export interface VerifiedGoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
  nonce?: string;
}

export interface OAuthTransactionPayload {
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectUrl?: string;
  mode: 'login' | 'link';
  linkUserId?: string;
}

interface LinkTicketPayload {
  userId: string;
  purpose: 'google_link';
}

const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

@Injectable()
export class GoogleOAuthService {
  private readonly authCfg: AuthConfig;
  private readonly appCfg: AppConfig;
  private readonly oauthClient: OAuth2Client | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly tokenIssuer: TokenIssuerService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {
    const authCfg = this.configService.get<AuthConfig>('auth');
    const appCfg = this.configService.get<AppConfig>('app');
    if (!authCfg || !appCfg) {
      throw new Error('Application configuration is not loaded');
    }
    this.authCfg = authCfg;
    this.appCfg = appCfg;

    if (
      authCfg.google.enabled &&
      authCfg.google.clientId &&
      authCfg.google.clientSecret &&
      authCfg.google.callbackUrl
    ) {
      this.oauthClient = new OAuth2Client(
        authCfg.google.clientId,
        authCfg.google.clientSecret,
        authCfg.google.callbackUrl,
      );
    } else {
      this.oauthClient = null;
    }
  }

  private assertGoogleEnabled(): OAuth2Client {
    if (!this.authCfg.allowedAuthProviders.includes('google')) {
      throw new ForbiddenException('Google authentication provider is disabled');
    }
    if (!this.authCfg.google.enabled || !this.oauthClient) {
      throw new ForbiddenException(
        'Google OAuth is not enabled or missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL',
      );
    }
    return this.oauthClient;
  }

  validateRedirectUrl(redirectUrl?: string): string | undefined {
    if (!redirectUrl) return undefined;
    const allowlist = new Set(this.appCfg.allowedOAuthRedirectUrls);
    if (!allowlist.has(redirectUrl)) {
      throw new BadRequestException(
        'Redirect URL is not in the ALLOWED_OAUTH_REDIRECT_URLS allowlist',
      );
    }
    return redirectUrl;
  }

  async createLinkTicket(
    actor: AuthenticatedUser,
    currentPassword?: string,
  ): Promise<{ linkTicket: string; expiresInSeconds: number }> {
    this.assertGoogleEnabled();

    const user = await this.prisma.user.findFirst({
      where: { id: actor.id, deletedAt: null, status: UserStatus.ACTIVE },
      select: { id: true, passwordHash: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestException(
          'Current password is required to authorize Google account linking',
        );
      }
      const valid = await this.cryptoService.verifyPassword(
        user.passwordHash,
        currentPassword,
      );
      if (!valid) {
        throw new UnauthorizedException('Invalid current password');
      }
    }

    const linkTicket = this.cryptoService.signPayload<LinkTicketPayload>(
      { userId: actor.id, purpose: 'google_link' },
      this.appCfg.cookie.secret,
      300,
    );

    return { linkTicket, expiresInSeconds: 300 };
  }

  buildAuthorizationRequest(options: {
    redirectUrl?: string;
    mode?: 'login' | 'link';
    linkTicket?: string;
  }): { authorizationUrl: string; signedTxCookie: string } {
    const client = this.assertGoogleEnabled();
    const safeRedirectUrl = this.validateRedirectUrl(options.redirectUrl);
    const mode = options.mode === 'link' ? 'link' : 'login';

    let linkUserId: string | undefined;
    if (mode === 'link') {
      if (!options.linkTicket) {
        throw new UnauthorizedException(
          'A valid linkTicket from POST /auth/google/link/prepare is required to link Google',
        );
      }
      const ticket = this.cryptoService.verifySignedPayload<LinkTicketPayload>(
        options.linkTicket,
        this.appCfg.cookie.secret,
      );
      if (!ticket || ticket.purpose !== 'google_link' || !ticket.userId) {
        throw new UnauthorizedException('Invalid or expired Google link ticket');
      }
      linkUserId = ticket.userId;
    }

    const state = this.cryptoService.generateOpaqueToken(24);
    const nonce = this.cryptoService.generateOpaqueToken(24);
    const { codeVerifier, codeChallenge } = this.cryptoService.generatePkcePair();

    const authorizationUrl = client.generateAuthUrl({
      access_type: 'online',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
    });

    const txPayload: OAuthTransactionPayload = {
      state,
      nonce,
      codeVerifier,
      redirectUrl: safeRedirectUrl,
      mode,
      linkUserId,
    };

    const signedTxCookie = this.cryptoService.signPayload(
      txPayload,
      this.appCfg.cookie.secret,
      600,
    );

    return { authorizationUrl, signedTxCookie };
  }

  async verifyGoogleIdToken(
    idToken: string,
    expectedNonce?: string,
  ): Promise<VerifiedGoogleIdentity> {
    const client = this.assertGoogleEnabled();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: this.authCfg.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException('Invalid Google ID token payload');
    }

    if (!payload.iss || !GOOGLE_ISSUERS.has(payload.iss)) {
      throw new UnauthorizedException('Untrusted Google ID token issuer');
    }

    if (payload.aud !== this.authCfg.google.clientId) {
      throw new UnauthorizedException('Google ID token audience mismatch');
    }

    if (expectedNonce && payload.nonce !== expectedNonce) {
      throw new UnauthorizedException('Google OIDC nonce mismatch');
    }

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Google ID token missing subject or email');
    }

    if (payload.email_verified !== true) {
      throw new ForbiddenException('Google email address must be verified');
    }

    return {
      sub: payload.sub,
      email: payload.email.trim().toLowerCase(),
      emailVerified: true,
      name: (payload.name ?? payload.email.split('@')[0]).trim(),
      picture: payload.picture ?? null,
      nonce: payload.nonce,
    };
  }

  async exchangeAuthorizationCode(
    code: string,
    codeVerifier: string,
    expectedNonce: string,
  ): Promise<VerifiedGoogleIdentity> {
    const client = this.assertGoogleEnabled();
    const { tokens } = await client.getToken({
      code,
      codeVerifier,
      redirect_uri: this.authCfg.google.callbackUrl,
    });

    if (!tokens.id_token) {
      throw new UnauthorizedException('Google OAuth response did not include an id_token');
    }

    return this.verifyGoogleIdToken(tokens.id_token, expectedNonce);
  }

  async handleCallback(
    params: {
      code?: string;
      state?: string;
      error?: string;
      errorDescription?: string;
    },
    signedTxCookie: string | undefined,
    clientMeta: SessionClientMetadata,
  ): Promise<{
    mode: 'login' | 'link';
    redirectUrl?: string;
    bundle?: AuthTokenBundle;
    linkedUserId?: string;
  }> {
    if (params.error) {
      throw new UnauthorizedException(
        `Google authentication failed: ${params.error}`,
      );
    }

    if (!signedTxCookie || !params.code || !params.state) {
      throw new BadRequestException('Missing OAuth state, authorization code, or transaction cookie');
    }

    const tx = this.cryptoService.verifySignedPayload<OAuthTransactionPayload>(
      signedTxCookie,
      this.appCfg.cookie.secret,
    );
    if (!tx) {
      throw new UnauthorizedException('Invalid or expired OAuth transaction cookie');
    }

    if (!this.cryptoService.timingSafeEqual(params.state, tx.state)) {
      throw new UnauthorizedException('Invalid OAuth state parameter');
    }

    const identity = await this.exchangeAuthorizationCode(
      params.code,
      tx.codeVerifier,
      tx.nonce,
    );

    if (tx.mode === 'link') {
      if (!tx.linkUserId) {
        throw new UnauthorizedException('Missing link target user');
      }
      await this.linkVerifiedGoogleIdentity(tx.linkUserId, identity, clientMeta);
      return {
        mode: 'link',
        redirectUrl: tx.redirectUrl,
        linkedUserId: tx.linkUserId,
      };
    }

    const bundle = await this.authenticateVerifiedGoogleIdentity(identity, clientMeta);
    return {
      mode: 'login',
      redirectUrl: tx.redirectUrl,
      bundle,
    };
  }

  async authenticateWithIdToken(
    idToken: string,
    clientMeta: SessionClientMetadata,
  ): Promise<AuthTokenBundle> {
    const identity = await this.verifyGoogleIdToken(idToken);
    return this.authenticateVerifiedGoogleIdentity(identity, clientMeta);
  }

  async linkWithIdToken(
    actor: AuthenticatedUser,
    idToken: string,
    currentPassword: string | undefined,
    clientMeta: SessionClientMetadata,
  ): Promise<{ message: string; provider: string; providerEmail: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id: actor.id, deletedAt: null, status: UserStatus.ACTIVE },
      select: { id: true, passwordHash: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestException(
          'Current password is required to link a Google account',
        );
      }
      const matches = await this.cryptoService.verifyPassword(
        user.passwordHash,
        currentPassword,
      );
      if (!matches) {
        throw new UnauthorizedException('Invalid current password');
      }
    }

    const identity = await this.verifyGoogleIdToken(idToken);
    await this.linkVerifiedGoogleIdentity(actor.id, identity, clientMeta);

    return {
      message: 'Google account linked successfully',
      provider: AuthProvider.GOOGLE,
      providerEmail: identity.email,
    };
  }

  async unlinkGoogleAccount(
    actor: AuthenticatedUser,
    clientMeta: SessionClientMetadata,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id: actor.id, deletedAt: null },
      select: { id: true, passwordHash: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new ConflictException(
        'Cannot unlink Google before setting a local password; doing so would lock your account',
      );
    }

    const deleted = await this.prisma.authProviderAccount.deleteMany({
      where: { userId: actor.id, provider: AuthProvider.GOOGLE },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('No Google account is currently linked');
    }

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.AUTH_GOOGLE_UNLINKED,
      targetType: 'AuthProviderAccount',
      targetId: actor.id,
      ipAddress: clientMeta.ipAddress,
      userAgent: clientMeta.userAgent,
    });

    return { message: 'Google account unlinked successfully' };
  }

  /**
   * Authenticates an existing linked Google account or creates a brand-new user.
   * Never silently auto-merges into an existing password account without verified
   * account ownership (explicit linking flow).
   */
  async authenticateVerifiedGoogleIdentity(
    identity: VerifiedGoogleIdentity,
    clientMeta: SessionClientMetadata,
  ): Promise<AuthTokenBundle> {
    if (!identity.emailVerified) {
      throw new ForbiddenException('Verified Google email is required');
    }

    const existingProviderAccount = await this.prisma.authProviderAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: AuthProvider.GOOGLE,
          providerUserId: identity.sub,
        },
      },
      include: { user: true },
    });

    if (existingProviderAccount) {
      const user = existingProviderAccount.user;
      if (user.deletedAt !== null || user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException('Account is suspended or inactive');
      }

      const bundle = await this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
            avatarUrl: user.avatarUrl ?? identity.picture,
          },
        });

        await tx.authProviderAccount.update({
          where: { id: existingProviderAccount.id },
          data: { providerEmail: identity.email },
        });

        const issued = await this.tokenIssuer.issueSessionAndTokens(
          updatedUser,
          clientMeta,
          tx,
        );

        await this.auditService.record(
          {
            actorId: user.id,
            action: AuditAction.AUTH_GOOGLE_LOGIN,
            targetType: 'Session',
            targetId: issued.sessionId,
            ipAddress: clientMeta.ipAddress,
            userAgent: clientMeta.userAgent,
          },
          tx,
        );

        return issued;
      });

      if (this.authCfg.enableLoginNotifications) {
        this.emailService.sendLoginNotificationEmail({
          to: bundle.user.email,
          name: bundle.user.name,
          ipAddress: clientMeta.ipAddress ?? 'unknown',
          userAgent: clientMeta.userAgent ?? 'unknown',
        });
      }

      return bundle;
    }

    const existingEmailUser = await this.prisma.user.findUnique({
      where: { email: identity.email },
      select: { id: true },
    });
    if (existingEmailUser) {
      throw new ConflictException({
        code: 'ACCOUNT_LINK_REQUIRED',
        message:
          'An account with this email already exists. Sign in with your existing method and explicitly link Google from your account settings.',
      });
    }

    const defaultRole = await this.prisma.role.findFirst({
      where: {
        scope: RoleScope.GLOBAL,
        slug: this.authCfg.defaultUserRole,
        organizationId: null,
      },
      select: { id: true, slug: true },
    });
    if (!defaultRole) {
      throw new NotFoundException(
        `Configured default user role "${this.authCfg.defaultUserRole}" was not found`,
      );
    }

    const bundle = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const newUser = await tx.user.create({
        data: {
          email: identity.email,
          name: identity.name,
          avatarUrl: identity.picture,
          passwordHash: null,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: now,
          lastLoginAt: now,
        },
      });

      await tx.authProviderAccount.create({
        data: {
          userId: newUser.id,
          provider: AuthProvider.GOOGLE,
          providerUserId: identity.sub,
          providerEmail: identity.email,
        },
      });

      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: defaultRole.id,
        },
      });

      const issued = await this.tokenIssuer.issueSessionAndTokens(
        newUser,
        clientMeta,
        tx,
      );

      await this.auditService.record(
        {
          actorId: newUser.id,
          action: AuditAction.AUTH_GOOGLE_REGISTER,
          targetType: 'User',
          targetId: newUser.id,
          ipAddress: clientMeta.ipAddress,
          userAgent: clientMeta.userAgent,
          metadata: { defaultRole: defaultRole.slug },
        },
        tx,
      );

      return issued;
    });

    this.emailService.sendWelcomeEmail(bundle.user.email, bundle.user.name);

    return bundle;
  }

  async linkVerifiedGoogleIdentity(
    userId: string,
    identity: VerifiedGoogleIdentity,
    clientMeta: SessionClientMetadata,
  ): Promise<void> {
    if (!identity.emailVerified) {
      throw new ForbiddenException('Verified Google email is required');
    }

    await this.prisma.$transaction(async (tx) => {
      const existingBySub = await tx.authProviderAccount.findUnique({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.GOOGLE,
            providerUserId: identity.sub,
          },
        },
      });
      if (existingBySub && existingBySub.userId !== userId) {
        throw new ConflictException(
          'This Google identity is already linked to a different account',
        );
      }

      const existingForUser = await tx.authProviderAccount.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: AuthProvider.GOOGLE,
          },
        },
      });
      if (existingForUser && existingForUser.providerUserId !== identity.sub) {
        throw new ConflictException(
          'A different Google identity is already linked to this account; unlink it first',
        );
      }

      if (!existingBySub) {
        await tx.authProviderAccount.create({
          data: {
            userId,
            provider: AuthProvider.GOOGLE,
            providerUserId: identity.sub,
            providerEmail: identity.email,
          },
        });
      }

      await this.auditService.record(
        {
          actorId: userId,
          action: AuditAction.AUTH_GOOGLE_LINKED,
          targetType: 'AuthProviderAccount',
          targetId: userId,
          ipAddress: clientMeta.ipAddress,
          userAgent: clientMeta.userAgent,
          metadata: { provider: AuthProvider.GOOGLE },
        },
        tx,
      );
    });
  }
}
