import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleScope, UserStatus } from '../generated/prisma/enums.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { CryptoService } from '../common/services/crypto.service.js';
import { addDurationToNow } from '../common/utils/duration.util.js';
import type { AuthConfig } from '../config/auth.config.js';
import { EmailService } from '../email/email.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  type SessionClientMetadata,
  SessionsService,
} from '../sessions/sessions.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { ResetPasswordDto } from './dto/recovery.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import {
  type AuthTokenBundle,
  type SafeAuthUserResponse,
  TokenIssuerService,
} from './token-issuer.service.js';

@Injectable()
export class AuthService {
  private readonly authCfg: AuthConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly sessionsService: SessionsService,
    private readonly tokenIssuer: TokenIssuerService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {
    const cfg = this.configService.get<AuthConfig>('auth');
    if (!cfg) {
      throw new Error('Auth configuration is not loaded');
    }
    this.authCfg = cfg;
  }

  private assertProviderAllowed(provider: string): void {
    if (!this.authCfg.allowedAuthProviders.includes(provider)) {
      throw new ForbiddenException(`Authentication provider "${provider}" is disabled`);
    }
  }

  async register(
    dto: RegisterDto,
    clientMeta: SessionClientMetadata,
  ): Promise<{
    user: SafeAuthUserResponse;
    emailVerificationRequired: boolean;
    message: string;
  }> {
    this.assertProviderAllowed('local');

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirmation do not match');
    }

    this.cryptoService.validatePasswordPolicy(dto.password, this.authCfg.passwordPolicy);

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('An account with this email address already exists');
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

    const passwordHash = await this.cryptoService.hashPassword(dto.password);
    const rawVerificationToken = this.cryptoService.generateOpaqueToken(36);
    const verificationTokenHash = this.cryptoService.hashToken(rawVerificationToken);
    const verificationExpiresAt = addDurationToNow(this.authCfg.emailVerificationExpiresIn);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: dto.name.trim(),
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: null,
        },
      });

      await tx.userRole.create({
        data: {
          userId: createdUser.id,
          roleId: defaultRole.id,
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: createdUser.id,
          tokenHash: verificationTokenHash,
          expiresAt: verificationExpiresAt,
        },
      });

      await this.auditService.record(
        {
          actorId: createdUser.id,
          action: AuditAction.AUTH_REGISTER,
          targetType: 'User',
          targetId: createdUser.id,
          ipAddress: clientMeta.ipAddress,
          userAgent: clientMeta.userAgent,
          metadata: { defaultRole: defaultRole.slug },
        },
        tx,
      );

      return createdUser;
    });

    this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      rawVerificationToken,
      this.authCfg.emailVerificationExpiresIn,
    );

    if (!this.authCfg.requireEmailVerification) {
      this.emailService.sendWelcomeEmail(user.email, user.name);
    }

    return {
      user: this.tokenIssuer.toSafeUser(user),
      emailVerificationRequired: this.authCfg.requireEmailVerification,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(
    dto: LoginDto,
    clientMeta: SessionClientMetadata,
  ): Promise<AuthTokenBundle> {
    this.assertProviderAllowed('local');

    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash || user.deletedAt !== null) {
      await this.cryptoService.verifyDummyPassword(dto.password);
      await this.auditService.record({
        actorId: user?.id ?? null,
        action: AuditAction.AUTH_LOGIN_FAILED,
        targetType: 'User',
        targetId: user?.id ?? null,
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
        metadata: { reason: 'invalid_credentials' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.cryptoService.verifyPassword(
      user.passwordHash,
      dto.password,
    );
    if (!passwordMatches) {
      await this.auditService.record({
        actorId: user.id,
        action: AuditAction.AUTH_LOGIN_FAILED,
        targetType: 'User',
        targetId: user.id,
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
        metadata: { reason: 'invalid_credentials' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      await this.auditService.record({
        actorId: user.id,
        action: AuditAction.AUTH_LOGIN_FAILED,
        targetType: 'User',
        targetId: user.id,
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
        metadata: { reason: 'account_not_active', status: user.status },
      });
      throw new ForbiddenException('Account is currently suspended or inactive');
    }

    if (this.authCfg.requireEmailVerification && !user.emailVerifiedAt) {
      await this.auditService.record({
        actorId: user.id,
        action: AuditAction.AUTH_LOGIN_FAILED,
        targetType: 'User',
        targetId: user.id,
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
        metadata: { reason: 'email_not_verified' },
      });
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before signing in',
      });
    }

    const bundle = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const issued = await this.tokenIssuer.issueSessionAndTokens(
        updatedUser,
        {
          ...clientMeta,
          deviceName: dto.deviceName ?? clientMeta.deviceName,
        },
        tx,
      );

      await this.auditService.record(
        {
          actorId: user.id,
          action: AuditAction.AUTH_LOGIN_SUCCESS,
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
        to: user.email,
        name: user.name,
        ipAddress: clientMeta.ipAddress ?? 'unknown',
        userAgent: clientMeta.userAgent ?? 'unknown',
      });
    }

    return bundle;
  }

  async refreshTokens(
    rawRefreshToken: string,
    clientMeta: SessionClientMetadata,
  ): Promise<AuthTokenBundle> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const rotated = await this.sessionsService.rotateRefreshToken(
      rawRefreshToken,
      clientMeta,
    );

    const accessToken = this.tokenIssuer.signAccessToken(
      rotated.user.id,
      rotated.sessionId,
      rotated.user.tokenVersion,
    );

    return {
      accessToken,
      refreshToken: rotated.rawRefreshToken,
      expiresIn: this.authCfg.jwtAccessExpiresIn,
      sessionId: rotated.sessionId,
      csrfToken: this.cryptoService.generateOpaqueToken(24),
      user: this.tokenIssuer.toSafeUser(rotated.user),
    };
  }

  async logout(
    actor: AuthenticatedUser,
    clientMeta: SessionClientMetadata,
  ): Promise<{ message: string }> {
    await this.sessionsService.revokeCurrentSession(
      actor.id,
      actor.sessionId,
      clientMeta,
    );
    return { message: 'Logged out successfully' };
  }

  async logoutAll(
    actor: AuthenticatedUser,
    clientMeta: SessionClientMetadata,
  ): Promise<{ message: string; revokedSessions: number }> {
    const revokedSessions = await this.sessionsService.revokeAllUserSessions(actor.id, {
      reason: 'LOGOUT_ALL',
      ipAddress: clientMeta.ipAddress,
      userAgent: clientMeta.userAgent,
    });

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.AUTH_LOGOUT_ALL,
      targetType: 'User',
      targetId: actor.id,
      ipAddress: clientMeta.ipAddress,
      userAgent: clientMeta.userAgent,
      metadata: { revokedSessions },
    });

    return { message: 'Logged out from all devices', revokedSessions };
  }

  async verifyEmail(
    rawToken: string,
    clientMeta: SessionClientMetadata,
  ): Promise<{ message: string }> {
    const tokenHash = this.cryptoService.hashToken(rawToken);
    const now = new Date();

    const verifiedUser = await this.prisma.$transaction(async (tx) => {
      const record = await tx.emailVerificationToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!record || record.consumedAt !== null || record.expiresAt <= now) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      if (record.user.deletedAt !== null || record.user.status === UserStatus.DELETED) {
        throw new BadRequestException('Invalid verification token');
      }

      const claimed = await tx.emailVerificationToken.updateMany({
        where: { id: record.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('Verification token has already been used');
      }

      // Consume any older pending verification tokens for this user
      await tx.emailVerificationToken.updateMany({
        where: { userId: record.userId, consumedAt: null },
        data: { consumedAt: now },
      });

      const updatedUser = await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: record.user.emailVerifiedAt ?? now },
      });

      await this.auditService.record(
        {
          actorId: record.userId,
          action: AuditAction.AUTH_EMAIL_VERIFIED,
          targetType: 'User',
          targetId: record.userId,
          ipAddress: clientMeta.ipAddress,
          userAgent: clientMeta.userAgent,
        },
        tx,
      );

      return updatedUser;
    });

    this.emailService.sendWelcomeEmail(verifiedUser.email, verifiedUser.name);

    return { message: 'Email verified successfully' };
  }

  async resendVerification(
    email: string,
    clientMeta: SessionClientMetadata,
  ): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'If an unverified account exists for this email address, a verification email has been sent.',
    };

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !user ||
      user.deletedAt !== null ||
      user.status !== UserStatus.ACTIVE ||
      user.emailVerifiedAt !== null
    ) {
      return genericResponse;
    }

    const rawToken = this.cryptoService.generateOpaqueToken(36);
    const tokenHash = this.cryptoService.hashToken(rawToken);
    const expiresAt = addDurationToNow(this.authCfg.emailVerificationExpiresIn);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: now },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await this.auditService.record(
        {
          actorId: user.id,
          action: AuditAction.AUTH_EMAIL_VERIFICATION_SENT,
          targetType: 'User',
          targetId: user.id,
          ipAddress: clientMeta.ipAddress,
          userAgent: clientMeta.userAgent,
        },
        tx,
      );
    });

    this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      rawToken,
      this.authCfg.emailVerificationExpiresIn,
    );

    return genericResponse;
  }

  async forgotPassword(
    email: string,
    clientMeta: SessionClientMetadata,
  ): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'If an account exists for this email address, a password reset link has been sent.',
    };

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.deletedAt !== null || user.status !== UserStatus.ACTIVE) {
      return genericResponse;
    }

    const rawToken = this.cryptoService.generateOpaqueToken(36);
    const tokenHash = this.cryptoService.hashToken(rawToken);
    const expiresAt = addDurationToNow(this.authCfg.passwordResetExpiresIn);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: now },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await this.auditService.record(
        {
          actorId: user.id,
          action: AuditAction.AUTH_PASSWORD_RESET_REQUESTED,
          targetType: 'User',
          targetId: user.id,
          ipAddress: clientMeta.ipAddress,
          userAgent: clientMeta.userAgent,
        },
        tx,
      );
    });

    this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      rawToken,
      this.authCfg.passwordResetExpiresIn,
    );

    return genericResponse;
  }

  async resetPassword(
    dto: ResetPasswordDto,
    clientMeta: SessionClientMetadata,
  ): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    this.cryptoService.validatePasswordPolicy(
      dto.newPassword,
      this.authCfg.passwordPolicy,
    );

    const tokenHash = this.cryptoService.hashToken(dto.token);
    const newPasswordHash = await this.cryptoService.hashPassword(dto.newPassword);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const resetRecord = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (
        !resetRecord ||
        resetRecord.consumedAt !== null ||
        resetRecord.expiresAt <= now
      ) {
        throw new BadRequestException('Invalid or expired password reset token');
      }

      if (
        resetRecord.user.deletedAt !== null ||
        resetRecord.user.status !== UserStatus.ACTIVE
      ) {
        throw new ForbiddenException('Account cannot reset password in its current state');
      }

      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: resetRecord.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('Password reset token has already been used');
      }

      await tx.passwordResetToken.updateMany({
        where: { userId: resetRecord.userId, consumedAt: null },
        data: { consumedAt: now },
      });

      await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 },
          // Resetting via verified email proves email ownership if not yet stamped
          emailVerifiedAt: resetRecord.user.emailVerifiedAt ?? now,
        },
      });

      await this.sessionsService.revokeAllUserSessions(resetRecord.userId, {
        reason: 'PASSWORD_RESET',
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
        tx,
      });

      await this.auditService.record(
        {
          actorId: resetRecord.userId,
          action: AuditAction.AUTH_PASSWORD_RESET_COMPLETED,
          targetType: 'User',
          targetId: resetRecord.userId,
          ipAddress: clientMeta.ipAddress,
          userAgent: clientMeta.userAgent,
        },
        tx,
      );
    });

    return {
      message: 'Password reset successful. Please sign in with your new password.',
    };
  }
}
