import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/client.js';
import { UserStatus } from '../generated/prisma/enums.js';
import { AuditService } from '../audit/audit.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import { CryptoService } from '../common/services/crypto.service.js';
import type { PasswordPolicyConfig } from '../config/auth.config.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { QueryUsersDto } from './dto/query-users.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  activeOrganizationId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly auditService: AuditService,
    private readonly authLookup: AuthorizationLookupService,
    private readonly sessionsService: SessionsService,
    private readonly configService: ConfigService,
  ) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        ...SAFE_USER_SELECT,
        passwordHash: true,
        providerAccounts: {
          select: {
            id: true,
            provider: true,
            providerEmail: true,
            createdAt: true,
          },
        },
        activeOrganization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    const { passwordHash, ...safeUser } = user;
    const authorization = await this.authLookup.getGlobalRolesAndPermissions(userId);

    return {
      ...safeUser,
      hasPassword: Boolean(passwordHash),
      roles: authorization.roleSlugs,
      permissions: authorization.permissionKeys,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
      select: SAFE_USER_SELECT,
    });

    await this.auditService.record({
      actorId: userId,
      action: AuditAction.USER_PROFILE_UPDATED,
      targetType: 'User',
      targetId: userId,
      metadata: {
        updatedFields: Object.keys(dto).filter(
          (k) => dto[k as keyof UpdateProfileDto] !== undefined,
        ),
      },
    });

    return updated;
  }

  async changeMyPassword(
    actor: AuthenticatedUser,
    dto: ChangePasswordDto,
    clientMeta?: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<{ message: string; revokedOtherSessions: number }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    const policy = this.configService.get<PasswordPolicyConfig>('auth.passwordPolicy') ?? {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: true,
    };
    this.cryptoService.validatePasswordPolicy(dto.newPassword, policy);

    const user = await this.prisma.user.findFirst({
      where: { id: actor.id, deletedAt: null },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.passwordHash) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required');
      }
      const valid = await this.cryptoService.verifyPassword(
        user.passwordHash,
        dto.currentPassword,
      );
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const newHash = await this.cryptoService.hashPassword(dto.newPassword);

    const revokedCount = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: actor.id },
        data: {
          passwordHash: newHash,
          ...(dto.revokeCurrentSession ? { tokenVersion: { increment: 1 } } : {}),
        },
      });

      const revoked = await this.sessionsService.revokeAllUserSessions(actor.id, {
        exceptSessionId: dto.revokeCurrentSession ? undefined : actor.sessionId,
        reason: 'PASSWORD_CHANGED',
        ipAddress: clientMeta?.ipAddress,
        userAgent: clientMeta?.userAgent,
        tx,
      });

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.USER_PASSWORD_CHANGED,
          targetType: 'User',
          targetId: actor.id,
          ipAddress: clientMeta?.ipAddress,
          userAgent: clientMeta?.userAgent,
          metadata: { revokedCurrentSession: Boolean(dto.revokeCurrentSession) },
        },
        tx,
      );

      return revoked;
    });

    return {
      message: 'Password updated successfully',
      revokedOtherSessions: revokedCount,
    };
  }

  async listUsers(query: QueryUsersDto): Promise<PaginatedResult<Record<string, unknown>>> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search.trim().toLowerCase(), mode: 'insensitive' } },
              { name: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        select: {
          ...SAFE_USER_SELECT,
          userRoles: {
            select: {
              role: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        ...u,
        roles: u.userRoles.map((ur) => ur.role),
        userRoles: undefined,
      })),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...SAFE_USER_SELECT,
        providerAccounts: {
          select: {
            id: true,
            provider: true,
            providerEmail: true,
            createdAt: true,
          },
        },
        userRoles: {
          select: {
            role: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role),
      userRoles: undefined,
    };
  }

  async updateUserStatus(
    targetUserId: string,
    dto: UpdateUserStatusDto,
    actor: AuthenticatedUser,
  ) {
    if (targetUserId === actor.id && dto.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('You cannot suspend or deactivate your own account');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const targetAuth = await this.authLookup.getGlobalRolesAndPermissions(targetUserId);
    if (targetAuth.roleSlugs.includes('super_admin')) {
      const actorAuth = await this.authLookup.getGlobalRolesAndPermissions(actor.id);
      if (!actorAuth.roleSlugs.includes('super_admin')) {
        throw new ForbiddenException('Only a super_admin can change status of a super_admin');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: {
          status: dto.status,
          ...(dto.status !== UserStatus.ACTIVE ? { tokenVersion: { increment: 1 } } : {}),
        },
        select: SAFE_USER_SELECT,
      });

      if (dto.status !== UserStatus.ACTIVE) {
        await this.sessionsService.revokeAllUserSessions(targetUserId, {
          reason: `ACCOUNT_${dto.status}`,
          tx,
        });
      }

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.USER_STATUS_CHANGED,
          targetType: 'User',
          targetId: targetUserId,
          metadata: {
            previousStatus: target.status,
            newStatus: dto.status,
            reason: dto.reason ?? null,
          },
        },
        tx,
      );

      return user;
    });

    return updated;
  }

  /**
   * Account deletion policy: soft-deletes and anonymizes personal identifiers,
   * removes auth provider links & pending tokens, revokes all active sessions,
   * and preserves audit log referential integrity.
   */
  async deleteUser(targetUserId: string, actor: AuthenticatedUser): Promise<void> {
    if (targetUserId === actor.id) {
      throw new ForbiddenException('Self-deletion via admin endpoint is disabled');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const targetAuth = await this.authLookup.getGlobalRolesAndPermissions(targetUserId);
    if (targetAuth.roleSlugs.includes('super_admin')) {
      const actorAuth = await this.authLookup.getGlobalRolesAndPermissions(actor.id);
      if (!actorAuth.roleSlugs.includes('super_admin')) {
        throw new ForbiddenException('Only a super_admin can delete a super_admin');
      }
      const superAdminRole = await this.prisma.role.findFirst({
        where: { slug: 'super_admin', organizationId: null },
      });
      if (superAdminRole) {
        const count = await this.prisma.userRole.count({
          where: { roleId: superAdminRole.id },
        });
        if (count <= 1) {
          throw new ConflictException('Cannot delete the last remaining super_admin');
        }
      }
    }

    const now = new Date();
    const anonymizedEmail = `deleted+${targetUserId}@deleted.local`;

    await this.prisma.$transaction(async (tx) => {
      await this.sessionsService.revokeAllUserSessions(targetUserId, {
        reason: 'ACCOUNT_DELETED',
        tx,
      });

      await tx.authProviderAccount.deleteMany({ where: { userId: targetUserId } });
      await tx.emailVerificationToken.deleteMany({ where: { userId: targetUserId } });
      await tx.passwordResetToken.deleteMany({ where: { userId: targetUserId } });
      await tx.userRole.deleteMany({ where: { userId: targetUserId } });
      await tx.organizationMember.deleteMany({ where: { userId: targetUserId } });

      await tx.user.update({
        where: { id: targetUserId },
        data: {
          email: anonymizedEmail,
          name: 'Deleted User',
          passwordHash: null,
          avatarUrl: null,
          activeOrganizationId: null,
          status: UserStatus.DELETED,
          deletedAt: now,
          tokenVersion: { increment: 1 },
        },
      });

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.USER_DELETED,
          targetType: 'User',
          targetId: targetUserId,
        },
        tx,
      );
    });
  }
}
