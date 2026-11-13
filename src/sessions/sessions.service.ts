import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { Prisma, type Session, type User } from '../generated/prisma/client.js';
import { UserStatus } from '../generated/prisma/enums.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { CryptoService } from '../common/services/crypto.service.js';
import { PolicyRegistryService } from '../common/services/policy-registry.service.js';
import { addDurationToNow } from '../common/utils/duration.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SessionResponseDto } from './dto/session-response.dto.js';
import { SessionPolicy } from './session.policy.js';

export const SESSION_POLICY_KEY = 'session';

export interface SessionClientMetadata {
  deviceName?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface IssuedSession {
  session: Session;
  rawRefreshToken: string;
}

export interface RotatedSessionResult {
  user: User;
  sessionId: string;
  rawRefreshToken: string;
  expiresAt: Date;
}

@Injectable()
export class SessionsService implements OnModuleInit {
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly policyRegistry: PolicyRegistryService,
    private readonly sessionPolicy: SessionPolicy,
  ) {
    this.refreshExpiresIn =
      this.configService.get<string>('auth.refreshTokenExpiresIn') ?? '30d';
  }

  onModuleInit(): void {
    this.policyRegistry.register(SESSION_POLICY_KEY, this.sessionPolicy);
  }

  async createSession(
    userId: string,
    metadata: SessionClientMetadata,
    tx?: Prisma.TransactionClient,
  ): Promise<IssuedSession> {
    const client = tx ?? this.prisma;
    const rawRefreshToken = this.cryptoService.generateOpaqueToken(48);
    const refreshTokenHash = this.cryptoService.hashToken(rawRefreshToken);
    const familyId = crypto.randomUUID();
    const expiresAt = addDurationToNow(this.refreshExpiresIn);

    const session = await client.session.create({
      data: {
        userId,
        familyId,
        refreshTokenHash,
        deviceName: metadata.deviceName ?? null,
        deviceType: metadata.deviceType ?? null,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
        expiresAt,
      },
    });

    return { session, rawRefreshToken };
  }

  async rotateRefreshToken(
    rawRefreshToken: string,
    metadata: SessionClientMetadata,
  ): Promise<RotatedSessionResult> {
    const tokenHash = this.cryptoService.hashToken(rawRefreshToken);
    const now = new Date();

    const outcome = await this.prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { refreshTokenHash: tokenHash },
        include: { user: true },
      });

      if (session) {
        if (session.revokedAt !== null) {
          await tx.session.updateMany({
            where: { familyId: session.familyId, revokedAt: null },
            data: {
              revokedAt: now,
              revokedReason: 'REVOKED_SESSION_REUSE_ATTEMPT',
            },
          });
          await this.auditService.record(
            {
              actorId: session.userId,
              action: AuditAction.AUTH_REFRESH_REUSE_DETECTED,
              targetType: 'Session',
              targetId: session.id,
              ipAddress: metadata.ipAddress,
              userAgent: metadata.userAgent,
              metadata: { familyId: session.familyId, reason: 'revoked_session_token_reused' },
            },
            tx,
          );
          return { ok: false as const, message: 'Refresh token has been revoked' };
        }

        if (session.expiresAt <= now) {
          await tx.session.update({
            where: { id: session.id },
            data: { revokedAt: now, revokedReason: 'EXPIRED' },
          });
          return { ok: false as const, message: 'Refresh token expired' };
        }

        if (session.user.status !== UserStatus.ACTIVE || session.user.deletedAt !== null) {
          await tx.session.update({
            where: { id: session.id },
            data: { revokedAt: now, revokedReason: 'USER_INACTIVE' },
          });
          return { ok: false as const, message: 'Account is not active' };
        }

        const newRawRefreshToken = this.cryptoService.generateOpaqueToken(48);
        const newRefreshTokenHash = this.cryptoService.hashToken(newRawRefreshToken);
        const newExpiresAt = addDurationToNow(this.refreshExpiresIn);

        const claimed = await tx.session.updateMany({
          where: {
            id: session.id,
            refreshTokenHash: tokenHash,
            revokedAt: null,
            expiresAt: { gt: now },
          },
          data: {
            refreshTokenHash: newRefreshTokenHash,
            lastActivityAt: now,
            expiresAt: newExpiresAt,
            ipAddress: metadata.ipAddress ?? session.ipAddress,
            userAgent: metadata.userAgent ?? session.userAgent,
          },
        });

        if (claimed.count !== 1) {
          await tx.session.updateMany({
            where: { familyId: session.familyId, revokedAt: null },
            data: {
              revokedAt: now,
              revokedReason: 'CONCURRENT_REFRESH_REUSE_DETECTED',
            },
          });
          await this.auditService.record(
            {
              actorId: session.userId,
              action: AuditAction.AUTH_REFRESH_REUSE_DETECTED,
              targetType: 'Session',
              targetId: session.id,
              ipAddress: metadata.ipAddress,
              userAgent: metadata.userAgent,
              metadata: { familyId: session.familyId, reason: 'concurrent_reuse' },
            },
            tx,
          );
          return { ok: false as const, message: 'Refresh token reuse detected' };
        }

        await tx.refreshTokenHistory.create({
          data: {
            sessionId: session.id,
            userId: session.userId,
            familyId: session.familyId,
            tokenHash,
            expiresAt: session.expiresAt,
          },
        });

        await this.auditService.record(
          {
            actorId: session.userId,
            action: AuditAction.AUTH_TOKEN_REFRESHED,
            targetType: 'Session',
            targetId: session.id,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          },
          tx,
        );

        return {
          ok: true as const,
          user: session.user,
          sessionId: session.id,
          rawRefreshToken: newRawRefreshToken,
          expiresAt: newExpiresAt,
        };
      }

      const rotatedHistory = await tx.refreshTokenHistory.findUnique({
        where: { tokenHash },
      });

      if (rotatedHistory) {
        await tx.session.updateMany({
          where: { familyId: rotatedHistory.familyId, revokedAt: null },
          data: {
            revokedAt: now,
            revokedReason: 'REFRESH_TOKEN_REUSE_DETECTED',
          },
        });
        await this.auditService.record(
          {
            actorId: rotatedHistory.userId,
            action: AuditAction.AUTH_REFRESH_REUSE_DETECTED,
            targetType: 'Session',
            targetId: rotatedHistory.sessionId,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            metadata: {
              familyId: rotatedHistory.familyId,
              reason: 'rotated_token_replayed',
            },
          },
          tx,
        );
        return {
          ok: false as const,
          message: 'Refresh token reuse detected; session family revoked',
        };
      }

      return { ok: false as const, message: 'Invalid refresh token' };
    });

    if (!outcome.ok) {
      throw new UnauthorizedException(outcome.message);
    }

    return {
      user: outcome.user,
      sessionId: outcome.sessionId,
      rawRefreshToken: outcome.rawRefreshToken,
      expiresAt: outcome.expiresAt,
    };
  }

  async listUserSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<SessionResponseDto[]> {
    const now = new Date();
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { lastActivityAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        ipAddress: true,
        userAgent: true,
        lastActivityAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return sessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeSessionById(
    actor: AuthenticatedUser,
    sessionId: string,
    metadata?: SessionClientMetadata,
  ): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.policyRegistry.authorizeOrThrow(
      SESSION_POLICY_KEY,
      actor,
      'revoke',
      session,
    );

    if (!session.revokedAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
          revokedReason:
            actor.id === session.userId ? 'REVOKED_BY_USER' : 'REVOKED_BY_ADMIN',
        },
      });
    }

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.SESSION_REVOKED,
      targetType: 'Session',
      targetId: session.id,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      metadata: { sessionOwnerId: session.userId },
    });
  }

  async revokeCurrentSession(
    userId: string,
    sessionId: string,
    metadata?: SessionClientMetadata,
  ): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokedReason: 'LOGOUT',
      },
    });

    await this.auditService.record({
      actorId: userId,
      action: AuditAction.AUTH_LOGOUT,
      targetType: 'Session',
      targetId: sessionId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  async revokeAllUserSessions(
    userId: string,
    options?: {
      exceptSessionId?: string;
      reason?: string;
      ipAddress?: string | null;
      userAgent?: string | null;
      tx?: Prisma.TransactionClient;
    },
  ): Promise<number> {
    const client = options?.tx ?? this.prisma;
    const result = await client.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(options?.exceptSessionId ? { id: { not: options.exceptSessionId } } : {}),
      },
      data: {
        revokedAt: new Date(),
        revokedReason: options?.reason ?? 'REVOKE_ALL',
      },
    });

    await this.auditService.record(
      {
        actorId: userId,
        action: AuditAction.SESSIONS_REVOKED_ALL,
        targetType: 'User',
        targetId: userId,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        metadata: {
          revokedCount: result.count,
          keptCurrentSession: Boolean(options?.exceptSessionId),
          reason: options?.reason ?? 'REVOKE_ALL',
        },
      },
      options?.tx,
    );

    return result.count;
  }

  async isSessionActive(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    return Boolean(session);
  }
}
