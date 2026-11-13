import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';

vi.mock('argon2', () => {
  const hashMock = vi.fn(async (plain: string) => `$argon2id$v=19$mocked$${Buffer.from(plain).toString('base64')}`);
  const verifyMock = vi.fn(async (hash: string, plain: string) => {
    const expected = `$argon2id$v=19$mocked$${Buffer.from(plain).toString('base64')}`;
    return hash === expected;
  });
  return {
    default: {
      argon2id: 2,
      hash: hashMock,
      verify: verifyMock,
    },
    argon2id: 2,
    hash: hashMock,
    verify: verifyMock,
  };
});

import { UserStatus } from '../generated/prisma/enums.js';
import type { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/security.enums.js';
import { CryptoService } from '../common/services/crypto.service.js';
import type { AuthConfig } from '../config/auth.config.js';
import type { EmailService } from '../email/email.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import { AuthService } from './auth.service.js';
import type { TokenIssuerService } from './token-issuer.service.js';

describe('AuthService', () => {
  const cryptoService = new CryptoService();
  let authService: AuthService;
  let txMock: {
    user: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    userRole: { create: ReturnType<typeof vi.fn> };
    emailVerificationToken: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
    passwordResetToken: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
  };
  let prismaMock: {
    $transaction: ReturnType<typeof vi.fn>;
    user: { findUnique: ReturnType<typeof vi.fn> };
    role: { findFirst: ReturnType<typeof vi.fn> };
  };
  let sessionsMock: {
    revokeAllUserSessions: ReturnType<typeof vi.fn>;
    revokeCurrentSession: ReturnType<typeof vi.fn>;
    rotateRefreshToken: ReturnType<typeof vi.fn>;
  };
  let emailMock: {
    sendVerificationEmail: ReturnType<typeof vi.fn>;
    sendWelcomeEmail: ReturnType<typeof vi.fn>;
    sendPasswordResetEmail: ReturnType<typeof vi.fn>;
    sendLoginNotificationEmail: ReturnType<typeof vi.fn>;
  };
  let auditMock: { record: ReturnType<typeof vi.fn> };
  let tokenIssuerMock: {
    toSafeUser: ReturnType<typeof vi.fn>;
    issueSessionAndTokens: ReturnType<typeof vi.fn>;
    signAccessToken: ReturnType<typeof vi.fn>;
  };

  const defaultAuthConfig: AuthConfig = {
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
      enabled: false,
      clientId: '',
      clientSecret: '',
      callbackUrl: 'http://localhost:3000/auth/google/callback',
    },
  };

  beforeEach(() => {
    txMock = {
      user: { create: vi.fn(), update: vi.fn() },
      userRole: { create: vi.fn() },
      emailVerificationToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      passwordResetToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
    };
    prismaMock = {
      $transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock)),
      user: { findUnique: vi.fn() },
      role: { findFirst: vi.fn() },
    };
    sessionsMock = {
      revokeAllUserSessions: vi.fn().mockResolvedValue(2),
      revokeCurrentSession: vi.fn().mockResolvedValue(undefined),
      rotateRefreshToken: vi.fn(),
    };
    emailMock = {
      sendVerificationEmail: vi.fn(),
      sendWelcomeEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      sendLoginNotificationEmail: vi.fn(),
    };
    auditMock = { record: vi.fn().mockResolvedValue(undefined) };
    tokenIssuerMock = {
      toSafeUser: vi.fn((u: Record<string, unknown>) => ({
        id: u.id,
        email: u.email,
        name: u.name,
      })),
      issueSessionAndTokens: vi.fn().mockResolvedValue({
        accessToken: 'jwt-access',
        refreshToken: 'opaque-refresh',
        expiresIn: '15m',
        sessionId: 'sess-1',
        csrfToken: 'csrf-1',
        user: { id: 'u1', email: 'alice@example.com', name: 'Alice' },
      }),
      signAccessToken: vi.fn().mockReturnValue('new-jwt'),
    };

    const configService = {
      get: vi.fn((key: string) => (key === 'auth' ? defaultAuthConfig : undefined)),
    } as unknown as ConfigService;

    authService = new AuthService(
      prismaMock as unknown as PrismaService,
      cryptoService,
      sessionsMock as unknown as SessionsService,
      tokenIssuerMock as unknown as TokenIssuerService,
      emailMock as unknown as EmailService,
      auditMock as unknown as AuditService,
      configService,
    );
  });

  it('registers a user with Argon2id password hash, default role, and hashed verification token', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.role.findFirst.mockResolvedValue({ id: 'role-cust', slug: 'customer' });
    txMock.user.create.mockResolvedValue({
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
    });

    const result = await authService.register(
      {
        name: 'Alice',
        email: 'Alice@Example.com',
        password: 'Str0ng!Password',
        confirmPassword: 'Str0ng!Password',
      },
      { ipAddress: '127.0.0.1' },
    );

    expect(result.emailVerificationRequired).toBe(true);
    const createdArgs = txMock.user.create.mock.calls[0][0] as {
      data: { email: string; passwordHash: string };
    };
    expect(createdArgs.data.email).toBe('alice@example.com');
    expect(createdArgs.data.passwordHash.startsWith('$argon2id$')).toBe(true);

    const tokenArgs = txMock.emailVerificationToken.create.mock.calls[0][0] as {
      data: { tokenHash: string };
    };
    expect(tokenArgs.data.tokenHash).toHaveLength(64);
    expect(emailMock.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('rejects duplicate registration and password mismatch', async () => {
    await expect(
      authService.register(
        {
          name: 'Alice',
          email: 'alice@example.com',
          password: 'Str0ng!Password',
          confirmPassword: 'Different!Password',
        },
        {},
      ),
    ).rejects.toThrow(BadRequestException);

    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      authService.register(
        {
          name: 'Alice',
          email: 'alice@example.com',
          password: 'Str0ng!Password',
          confirmPassword: 'Str0ng!Password',
        },
        {},
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('prevents account enumeration with generic login errors and enforces email verification', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      authService.login(
        { email: 'nobody@example.com', password: 'AnyPassword1!' },
        {},
      ),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));

    const hash = await cryptoService.hashPassword('Str0ng!Password');
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'alice@example.com',
      passwordHash: hash,
      status: UserStatus.ACTIVE,
      deletedAt: null,
      emailVerifiedAt: null,
    });

    await expect(
      authService.login(
        { email: 'alice@example.com', password: 'WrongPassword1!' },
        {},
      ),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));

    await expect(
      authService.login(
        { email: 'alice@example.com', password: 'Str0ng!Password' },
        {},
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('verifies email token once and rejects reused or expired tokens', async () => {
    const raw = cryptoService.generateOpaqueToken(36);
    const hash = cryptoService.hashToken(raw);
    txMock.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'evt-1',
      userId: 'u1',
      tokenHash: hash,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'u1', status: UserStatus.ACTIVE, deletedAt: null, emailVerifiedAt: null },
    });
    txMock.emailVerificationToken.updateMany.mockResolvedValue({ count: 1 });
    txMock.user.update.mockResolvedValue({
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
    });

    await expect(authService.verifyEmail(raw, {})).resolves.toEqual({
      message: 'Email verified successfully',
    });
    expect(emailMock.sendWelcomeEmail).toHaveBeenCalledTimes(1);

    txMock.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'evt-1',
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(authService.verifyEmail(raw, {})).rejects.toThrow(BadRequestException);
  });

  it('prevents password-reset enumeration and revokes all existing sessions on reset', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const forgotUnknown = await authService.forgotPassword('missing@example.com', {});
    expect(forgotUnknown.message).toContain('If an account exists');

    const rawReset = cryptoService.generateOpaqueToken(36);
    txMock.passwordResetToken.findUnique.mockResolvedValue({
      id: 'prt-1',
      userId: 'u1',
      tokenHash: cryptoService.hashToken(rawReset),
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'u1',
        status: UserStatus.ACTIVE,
        deletedAt: null,
        emailVerifiedAt: new Date(),
      },
    });
    txMock.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });

    await authService.resetPassword(
      {
        token: rawReset,
        newPassword: 'NewStr0ng!Password',
        confirmPassword: 'NewStr0ng!Password',
      },
      {},
    );

    expect(sessionsMock.revokeAllUserSessions).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ reason: 'PASSWORD_RESET' }),
    );
    expect(auditMock.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.AUTH_PASSWORD_RESET_COMPLETED }),
      txMock,
    );
  });
});
