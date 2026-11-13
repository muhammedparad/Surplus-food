import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';
import { AuthProvider, UserStatus } from '../generated/prisma/enums.js';
import type { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { CryptoService } from '../common/services/crypto.service.js';
import type { AppConfig } from '../config/app.config.js';
import type { AuthConfig } from '../config/auth.config.js';
import type { EmailService } from '../email/email.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { GoogleOAuthService } from './google-oauth.service.js';
import type { TokenIssuerService } from './token-issuer.service.js';

describe('GoogleOAuthService', () => {
  const cryptoService = new CryptoService();
  let googleService: GoogleOAuthService;
  let prismaMock: {
    $transaction: ReturnType<typeof vi.fn>;
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    role: { findFirst: ReturnType<typeof vi.fn> };
    authProviderAccount: {
      findUnique: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };
  let txMock: {
    user: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    authProviderAccount: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    userRole: { create: ReturnType<typeof vi.fn> };
  };

  const authCfg: AuthConfig = {
    jwtAccessSecret: 'test-jwt-secret-123456789012345678901234',
    jwtAccessExpiresIn: '15m',
    refreshTokenExpiresIn: '30d',
    emailVerificationExpiresIn: '24h',
    passwordResetExpiresIn: '1h',
    invitationExpiresIn: '7d',
    defaultUserRole: 'customer',
    requireEmailVerification: true,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: true,
    },
    enableOrganizations: true,
    enableLoginNotifications: false,
    enableMfa: false,
    allowedAuthProviders: ['local', 'google'],
    google: {
      enabled: true,
      clientId: 'google-client-id.apps.googleusercontent.com',
      clientSecret: 'google-client-secret',
      callbackUrl: 'http://localhost:3000/auth/google/callback',
    },
  };

  const appCfg: AppConfig = {
    nodeEnv: 'test',
    port: 3000,
    appName: 'AuthPlatform',
    appUrl: 'http://localhost:3000',
    frontendUrl: 'http://localhost:3001',
    apiPrefix: '',
    trustProxy: false,
    allowedOrigins: ['http://localhost:3001'],
    allowedOAuthRedirectUrls: ['http://localhost:3001/auth/callback'],
    cookie: {
      secret: 'test-cookie-secret-12345678901234567890',
      sameSite: 'lax',
      secure: false,
    },
    csrfProtectionEnabled: true,
    database: { url: 'postgresql://localhost/test', ssl: false, sslRejectUnauthorized: true },
    throttle: { ttlMs: 60000, limit: 60, authTtlMs: 60000, authLimit: 10 },
  };

  beforeEach(() => {
    txMock = {
      user: { create: vi.fn(), update: vi.fn() },
      authProviderAccount: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      userRole: { create: vi.fn() },
    };
    prismaMock = {
      $transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock)),
      user: { findUnique: vi.fn(), findFirst: vi.fn() },
      role: { findFirst: vi.fn() },
      authProviderAccount: { findUnique: vi.fn(), deleteMany: vi.fn() },
    };

    const configService = {
      get: vi.fn((key: string) => {
        if (key === 'auth') return authCfg;
        if (key === 'app') return appCfg;
        return undefined;
      }),
    } as unknown as ConfigService;

    const tokenIssuer = {
      issueSessionAndTokens: vi.fn().mockResolvedValue({
        accessToken: 'jwt',
        refreshToken: 'refresh',
        expiresIn: '15m',
        sessionId: 'sess-1',
        csrfToken: 'csrf',
        user: { id: 'u1', email: 'g@example.com', name: 'G User' },
      }),
    } as unknown as TokenIssuerService;

    const emailService = {
      sendWelcomeEmail: vi.fn(),
      sendLoginNotificationEmail: vi.fn(),
    } as unknown as EmailService;

    const auditService = {
      record: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;

    googleService = new GoogleOAuthService(
      prismaMock as unknown as PrismaService,
      cryptoService,
      tokenIssuer,
      emailService,
      auditService,
      configService,
    );
  });

  it('rejects non-allowlisted redirectUrl and generates PKCE S256 + state cookie for valid redirect', () => {
    expect(() =>
      googleService.buildAuthorizationRequest({
        redirectUrl: 'https://evil.example.com/steal',
      }),
    ).toThrow(BadRequestException);

    const req = googleService.buildAuthorizationRequest({
      redirectUrl: 'http://localhost:3001/auth/callback',
    });

    expect(req.authorizationUrl).toContain('code_challenge=');
    expect(req.authorizationUrl).toContain('code_challenge_method=S256');
    expect(req.authorizationUrl).toContain('state=');
    expect(req.signedTxCookie).toContain('.');
  });

  it('rejects callback with mismatched state or Google error', async () => {
    const { signedTxCookie } = googleService.buildAuthorizationRequest({});

    await expect(
      googleService.handleCallback(
        { error: 'access_denied' },
        signedTxCookie,
        {},
      ),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      googleService.handleCallback(
        { code: 'auth-code', state: 'wrong-state' },
        signedTxCookie,
        {},
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('creates a new verified user + separate AuthProviderAccount on first Google sign-up', async () => {
    prismaMock.authProviderAccount.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.role.findFirst.mockResolvedValue({ id: 'role-cust', slug: 'customer' });
    txMock.user.create.mockResolvedValue({
      id: 'u-google-1',
      email: 'guser@example.com',
      name: 'Google User',
      status: UserStatus.ACTIVE,
    });

    const bundle = await googleService.authenticateVerifiedGoogleIdentity(
      {
        sub: 'google-sub-12345',
        email: 'guser@example.com',
        emailVerified: true,
        name: 'Google User',
        picture: 'https://lh3.googleusercontent.com/avatar.png',
      },
      {},
    );

    expect(bundle.accessToken).toBe('jwt');
    expect(txMock.authProviderAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: AuthProvider.GOOGLE,
          providerUserId: 'google-sub-12345',
        }),
      }),
    );
  });

  it('blocks silent auto-merge when an unlinked email/password account already exists', async () => {
    prismaMock.authProviderAccount.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-password-user' });

    await expect(
      googleService.authenticateVerifiedGoogleIdentity(
        {
          sub: 'google-sub-999',
          email: 'existing@example.com',
          emailVerified: true,
          name: 'Existing User',
          picture: null,
        },
        {},
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('requires password verification for explicit linking and blocks unlink lockout', async () => {
    const hash = await cryptoService.hashPassword('CurrentP@ss123');
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'u1',
      passwordHash: hash,
    });

    const actor: AuthenticatedUser = {
      id: 'u1',
      email: 'u1@example.com',
      name: 'U1',
      avatarUrl: null,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      activeOrganizationId: null,
      sessionId: 's1',
      tokenVersion: 1,
    };

    await expect(
      googleService.createLinkTicket(actor, 'WrongP@ss123'),
    ).rejects.toThrow(UnauthorizedException);

    const ticket = await googleService.createLinkTicket(actor, 'CurrentP@ss123');
    expect(ticket.linkTicket).toContain('.');

    // Prevent unlinking if no local password exists
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'u1',
      passwordHash: null,
    });
    await expect(googleService.unlinkGoogleAccount(actor, {})).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects unverified Google email', async () => {
    await expect(
      googleService.authenticateVerifiedGoogleIdentity(
        {
          sub: 'sub-1',
          email: 'unverified@example.com',
          emailVerified: false,
          name: 'Unverified',
          picture: null,
        },
        {},
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
