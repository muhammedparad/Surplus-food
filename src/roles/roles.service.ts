import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleScope } from '../generated/prisma/enums.js';
import { AuditService } from '../audit/audit.service.js';
import { SYSTEM_PROTECTED_ROLE_SLUGS } from '../common/constants/auth.constants.js';
import { AuditAction } from '../common/enums/security.enums.js';
import { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AssignPermissionsDto } from './dto/assign-permissions.dto.js';
import type { CreateRoleDto } from './dto/create-role.dto.js';
import type { UpdateRoleDto } from './dto/update-role.dto.js';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly authLookup: AuthorizationLookupService,
  ) {}

  private normalizeSlug(nameOrSlug: string): string {
    return nameOrSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async create(dto: CreateRoleDto, actorId: string) {
    const scope = dto.scope ?? RoleScope.GLOBAL;
    const slug = this.normalizeSlug(dto.slug ?? dto.name);
    if (!slug) {
      throw new BadRequestException('A valid role slug could not be derived');
    }

    if (scope === RoleScope.GLOBAL && dto.organizationId) {
      throw new BadRequestException(
        'Global roles cannot be scoped to a specific organization',
      );
    }

    if (dto.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
        select: { id: true },
      });
      if (!org) {
        throw new NotFoundException('Target organization not found');
      }
    }

    const duplicate = await this.prisma.role.findFirst({
      where: {
        scope,
        slug,
        organizationId: dto.organizationId ?? null,
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(
        `Role with slug "${slug}" already exists in ${scope} scope`,
      );
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() ?? null,
        scope,
        isSystem: false,
        organizationId: dto.organizationId ?? null,
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    await this.auditService.record({
      actorId,
      action: AuditAction.ROLE_CREATED,
      targetType: 'Role',
      targetId: role.id,
      organizationId: role.organizationId,
      metadata: { slug: role.slug, scope: role.scope },
    });

    return this.formatRole(role);
  }

  async findAll(filter?: { scope?: RoleScope; organizationId?: string }) {
    const roles = await this.prisma.role.findMany({
      where: {
        ...(filter?.scope ? { scope: filter.scope } : {}),
        ...(filter?.organizationId !== undefined
          ? { organizationId: filter.organizationId }
          : {}),
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: [{ scope: 'asc' }, { isSystem: 'desc' }, { name: 'asc' }],
    });

    return roles.map((role) => this.formatRole(role));
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.formatRole(role);
  }

  async update(id: string, dto: UpdateRoleDto, actorId: string) {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    if (existing.slug === 'super_admin') {
      const actorAuth = await this.authLookup.getGlobalRolesAndPermissions(actorId);
      if (!actorAuth.roleSlugs.includes('super_admin')) {
        throw new ForbiddenException('Only a super_admin can modify the super_admin role');
      }
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    await this.auditService.record({
      actorId,
      action: AuditAction.ROLE_UPDATED,
      targetType: 'Role',
      targetId: updated.id,
      organizationId: updated.organizationId,
      metadata: { slug: updated.slug },
    });

    return this.formatRole(updated);
  }

  async delete(id: string, actorId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem || SYSTEM_PROTECTED_ROLE_SLUGS.has(role.slug)) {
      throw new ForbiddenException('System-defined roles cannot be deleted');
    }

    await this.prisma.role.delete({ where: { id } });

    await this.auditService.record({
      actorId,
      action: AuditAction.ROLE_DELETED,
      targetType: 'Role',
      targetId: role.id,
      organizationId: role.organizationId,
      metadata: { slug: role.slug },
    });
  }

  async assignPermissions(
    roleId: string,
    dto: AssignPermissionsDto,
    actorId: string,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const actorAuth = await this.authLookup.getGlobalRolesAndPermissions(actorId);
    const isSuperAdmin = actorAuth.roleSlugs.includes('super_admin');

    if (role.slug === 'super_admin' && !isSuperAdmin) {
      throw new ForbiddenException('Only a super_admin can modify super_admin permissions');
    }

    const requestedIds = dto.permissionIds ?? [];
    const requestedKeys = (dto.permissionKeys ?? []).map((k) => k.trim().toLowerCase());
    if (requestedIds.length === 0 && requestedKeys.length === 0) {
      throw new BadRequestException(
        'Provide at least one permissionId or permissionKey to assign',
      );
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        OR: [
          ...(requestedIds.length > 0 ? [{ id: { in: requestedIds } }] : []),
          ...(requestedKeys.length > 0 ? [{ key: { in: requestedKeys } }] : []),
        ],
      },
    });

    const foundIds = new Set(permissions.map((p) => p.id));
    const foundKeys = new Set(permissions.map((p) => p.key));
    if (
      requestedIds.some((id) => !foundIds.has(id)) ||
      requestedKeys.some((key) => !foundKeys.has(key))
    ) {
      throw new NotFoundException('One or more specified permissions do not exist');
    }

    if (!isSuperAdmin) {
      const actorPermSet = new Set(actorAuth.permissionKeys);
      const escalated = permissions.filter((p) => !actorPermSet.has(p.key));
      if (escalated.length > 0) {
        throw new ForbiddenException(
          `Privilege escalation blocked: you cannot grant permissions you do not hold (${escalated
            .map((p) => p.key)
            .join(', ')})`,
        );
      }
    }

    const mode = dto.mode ?? 'add';
    if (role.slug === 'super_admin' && mode === 'replace') {
      throw new ForbiddenException(
        'Cannot replace super_admin permissions destructively',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if (mode === 'replace') {
        await tx.rolePermission.deleteMany({
          where: {
            roleId: role.id,
            permissionId: { notIn: permissions.map((p) => p.id) },
          },
        });
      }

      for (const permission of permissions) {
        await tx.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }

      await this.auditService.record(
        {
          actorId,
          action: AuditAction.ROLE_PERMISSIONS_UPDATED,
          targetType: 'Role',
          targetId: role.id,
          organizationId: role.organizationId,
          metadata: {
            mode,
            permissionKeys: permissions.map((p) => p.key),
          },
        },
        tx,
      );
    });

    return this.findById(role.id);
  }

  async removePermission(
    roleId: string,
    permissionId: string,
    actorId: string,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.slug === 'super_admin') {
      throw new ForbiddenException('Cannot remove permissions from super_admin role');
    }

    const deleted = await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('Permission is not assigned to this role');
    }

    await this.auditService.record({
      actorId,
      action: AuditAction.ROLE_PERMISSIONS_UPDATED,
      targetType: 'Role',
      targetId: role.id,
      organizationId: role.organizationId,
      metadata: { removedPermissionId: permissionId },
    });

    return this.findById(role.id);
  }

  async assignRoleToUser(userId: string, roleId: string, actorId: string) {
    const [user, role] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } }),
      this.prisma.role.findUnique({ where: { id: roleId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.scope !== RoleScope.GLOBAL || role.organizationId !== null) {
      throw new BadRequestException(
        'Only GLOBAL roles can be assigned globally to a user; use organization endpoints for organization roles',
      );
    }

    if (role.slug === 'super_admin') {
      const actorAuth = await this.authLookup.getGlobalRolesAndPermissions(actorId);
      if (!actorAuth.roleSlugs.includes('super_admin')) {
        throw new ForbiddenException('Only a super_admin can assign the super_admin role');
      }
    }

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId, assignedById: actorId },
    });

    await this.auditService.record({
      actorId,
      action: AuditAction.USER_ROLE_ASSIGNED,
      targetType: 'User',
      targetId: userId,
      metadata: { roleId: role.id, roleSlug: role.slug },
    });

    return {
      userId,
      roleId: role.id,
      roleSlug: role.slug,
      assigned: true,
    };
  }

  async removeRoleFromUser(userId: string, roleId: string, actorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.slug === 'super_admin') {
      const actorAuth = await this.authLookup.getGlobalRolesAndPermissions(actorId);
      if (!actorAuth.roleSlugs.includes('super_admin')) {
        throw new ForbiddenException('Only a super_admin can revoke the super_admin role');
      }
      const superAdminCount = await this.prisma.userRole.count({
        where: { roleId: role.id },
      });
      if (superAdminCount <= 1) {
        throw new ConflictException(
          'Cannot revoke the last remaining super_admin assignment',
        );
      }
    }

    const deleted = await this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('User does not hold the specified role');
    }

    await this.auditService.record({
      actorId,
      action: AuditAction.USER_ROLE_REVOKED,
      targetType: 'User',
      targetId: userId,
      metadata: { roleId: role.id, roleSlug: role.slug },
    });

    return { message: 'Role removed from user' };
  }

  private formatRole(role: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    scope: RoleScope;
    isSystem: boolean;
    organizationId: string | null;
    createdAt: Date;
    updatedAt: Date;
    rolePermissions: Array<{
      permission: {
        id: string;
        key: string;
        resource: string;
        action: string;
        description: string | null;
      };
    }>;
  }) {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      scope: role.scope,
      isSystem: role.isSystem,
      organizationId: role.organizationId,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  }
}
