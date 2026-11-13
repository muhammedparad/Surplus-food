import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';
import { UserStatus } from '../generated/prisma/enums.js';
import type { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import type { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import { CryptoService } from '../common/services/crypto.service.js';
import { PolicyRegistryService } from '../common/services/policy-registry.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SessionPolicy } from './session.policy.js';
import { SessionsService } from './sessions.service.js';

describe('SessionsService', () => {
  const cryptoService = new CryptoService();
  let sessionsService: SessionsService;
  let auditRecord: ReturnType<typeof vi.fn>;
  let authLookupMock: { getGlobalRolesAndPermissions: ReturnType<typeof vi.fn> };
  let txMock: {
    session: {
      findUnique: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    refreshTokenHistory: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let prismaMock: {
    $transaction: ReturnType<typeof vi.fn>;
    session: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    txMock = {
      session: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      refreshTokenHistory: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };
    prismaMock = {
      $transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock)),
      session: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };
    auditRecord = vi.fn().mockResolvedValue(undefined);
    authLookupMock = {
      getGlobalRolesAndPermissions: vi.fn().mockResolvedValue({
        roleSlugs: ['customer'],
        permissionKeys: [],
      }),
    };

    const configService = {
      get: vi.fn((key: string) =>
        key === 'auth.refreshTokenExpiresIn' ? '30d' : undefined,
      ),
    } as unknown as ConfigService;

    const policyRegistry = new PolicyRegistryService();
    const sessionPolicy = new SessionPolicy(
      authLookupMock as unknown as AuthorizationLookupService,
    );

    sessionsService = new SessionsService(
      prismaMock as unknown as PrismaService,
      cryptoService,
      { record: auditRecord } as unknown as AuditService,
      configService,
      policyRegistry,
      sessionPolicy,
    );
    sessionsService.onModuleInit();
  });

  it('stores only hashed refresh tokens when creating a session', async () => {
    prismaMock.session.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'sess-1',
        ...data,
      }),
    );

    const issued = await sessionsService.createSession('user-1', {
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });

    const createCall = prismaMock.session.create.mock.calls[0][0] as {
      data: { refreshTokenHash: string };
    };
    expect(createCall.data.refreshTokenHash).toBe(
      cryptoService.hashToken(issued.rawRefreshToken),
    );
    expect(createCall.data.refreshTokenHash).not.toBe(issued.rawRefreshToken);
  });

  it('rotates refresh token atomically and saves previous hash in history', async () => {
    const rawOld = cryptoService.generateOpaqueToken(48);
    const oldHash = cryptoService.hashToken(rawOld);
    const future = new Date(Date.now() + 60_000);

    txMock.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      userId: 'user-1',
      familyId: 'fam-1',
      refreshTokenHash: oldHash,
      revokedAt: null,
      expiresAt: future,
      ipAddress: '1.1.1.1',
      userAgent: 'ua',
      user: {
        id: 'user-1',
        status: UserStatus.ACTIVE,
        deletedAt: null,
        tokenVersion: 1,
      },
    });
    txMock.session.updateMany.mockResolvedValue({ count: 1 });
    txMock.refreshTokenHistory.create.mockResolvedValue({});

    const rotated = await sessionsService.rotateRefreshToken(rawOld, {
      ipAddress: '2.2.2.2',
      userAgent: 'ua2',
    });

    expect(rotated.rawRefreshToken).not.toBe(rawOld);
    expect(txMock.refreshTokenHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessionId: 'sess-1',
          familyId: 'fam-1',
          tokenHash: oldHash,
        }),
      }),
    );
  });

  it('detects reuse of a rotated refresh token and revokes the entire token family', async () => {
    const replayedRaw = cryptoService.generateOpaqueToken(48);
    const replayedHash = cryptoService.hashToken(replayedRaw);

    txMock.session.findUnique.mockResolvedValue(null);
    txMock.refreshTokenHistory.findUnique.mockResolvedValue({
      id: 'hist-1',
      sessionId: 'sess-1',
      userId: 'user-1',
      familyId: 'fam-compromised',
      tokenHash: replayedHash,
    });
    txMock.session.updateMany.mockResolvedValue({ count: 2 });

    await expect(
      sessionsService.rotateRefreshToken(replayedRaw, {}),
    ).rejects.toThrow(UnauthorizedException);

    expect(txMock.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { familyId: 'fam-compromised', revokedAt: null },
        data: expect.objectContaining({
          revokedReason: 'REFRESH_TOKEN_REUSE_DETECTED',
        }),
      }),
    );
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.AUTH_REFRESH_REUSE_DETECTED,
      }),
      txMock,
    );
  });

  it('enforces SessionPolicy so users cannot revoke another user session without session:revoke', async () => {
    prismaMock.session.findUnique.mockResolvedValue({
      id: 'sess-other',
      userId: 'user-2',
      revokedAt: null,
    });

    const actor: AuthenticatedUser = {
      id: 'user-1',
      email: 'u1@example.com',
      name: 'U1',
      avatarUrl: null,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      activeOrganizationId: null,
      sessionId: 'sess-own',
      tokenVersion: 1,
    };

    await expect(sessionsService.revokeSessionById(actor, 'sess-other')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
