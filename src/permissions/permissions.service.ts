import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PermissionScope } from '../generated/prisma/enums.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { PermissionDefinition } from '../common/interfaces/auth-module-options.interface.js';
import { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePermissionDto } from './dto/create-permission.dto.js';
import type { UpdatePermissionDto } from './dto/update-permission.dto.js';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly authLookup: AuthorizationLookupService,
  ) {}

  private parsePermissionKey(rawKey: string): { key: string; resource: string; action: string } {
    const key = rawKey.trim().toLowerCase();
    const match = /^([a-z][a-z0-9_]*):([a-z][a-z0-9_]*)$/.exec(key);
    if (!match) {
      throw new BadRequestException(
        'Permission key must follow lowercase resource:action convention',
      );
    }
    return { key, resource: match[1], action: match[2] };
  }

  async create(dto: CreatePermissionDto, actorId: string) {
    const { key, resource, action } = this.parsePermissionKey(dto.key);

    const existing = await this.prisma.permission.findUnique({ where: { key } });
    if (existing) {
      throw new ConflictException(`Permission "${key}" already exists`);
    }

    const permission = await this.prisma.permission.create({
      data: {
        key,
        resource,
        action,
        description: dto.description?.trim() ?? null,
        scope: dto.scope ?? PermissionScope.BOTH,
        isSystem: false,
      },
    });

    await this.auditService.record({
      actorId,
      action: AuditAction.PERMISSION_CREATED,
      targetType: 'Permission',
      targetId: permission.id,
      metadata: { key: permission.key, scope: permission.scope },
    });

    return permission;
  }

  async findAll(filter?: { resource?: string; scope?: PermissionScope }) {
    return this.prisma.permission.findMany({
      where: {
        ...(filter?.resource ? { resource: filter.resource.trim().toLowerCase() } : {}),
        ...(filter?.scope ? { scope: filter.scope } : {}),
      },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async findById(id: string) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto, actorId: string) {
    const existing = await this.findById(id);

    const updated = await this.prisma.permission.update({
      where: { id: existing.id },
      data: {
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.scope !== undefined ? { scope: dto.scope } : {}),
      },
    });

    await this.auditService.record({
      actorId,
      action: AuditAction.PERMISSION_UPDATED,
      targetType: 'Permission',
      targetId: updated.id,
      metadata: { key: updated.key },
    });

    return updated;
  }

  /**
   * Reusable helper allowing downstream SaaS feature modules to register
   * their own granular permissions idempotently at startup.
   */
  async registerModulePermissions(definitions: PermissionDefinition[]): Promise<void> {
    for (const def of definitions) {
      const { key, resource, action } = this.parsePermissionKey(def.key);
      await this.prisma.permission.upsert({
        where: { key },
        update: {
          description: def.description,
          ...(def.scope ? { scope: def.scope } : {}),
        },
        create: {
          key,
          resource,
          action,
          description: def.description,
          scope: def.scope ?? PermissionScope.BOTH,
          isSystem: false,
        },
      });
    }
  }

  async getEffectivePermissionsForUser(userId: string, organizationId?: string) {
    if (organizationId) {
      const orgContext = await this.authLookup.getOrganizationMembershipContext(
        userId,
        organizationId,
      );
      if (!orgContext) {
        return {
          scope: 'ORGANIZATION' as const,
          organizationId,
          roles: [],
          permissions: [],
        };
      }
      return {
        scope: 'ORGANIZATION' as const,
        organizationId,
        roles: orgContext.roleSlugs,
        permissions: orgContext.permissionKeys,
      };
    }

    const globalAuth = await this.authLookup.getGlobalRolesAndPermissions(userId);
    return {
      scope: 'GLOBAL' as const,
      roles: globalAuth.roleSlugs,
      permissions: globalAuth.permissionKeys,
    };
  }
}
