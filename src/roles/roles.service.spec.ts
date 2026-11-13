import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { vi } from 'vitest';
import { RoleScope } from '../generated/prisma/enums.js';
import type { AuditService } from '../audit/audit.service.js';
import type { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { RolesService } from './roles.service.js';

describe('RolesService', () => {
  let service: RolesService;
  let prismaMock: {
    $transaction: ReturnType<typeof vi.fn>;
    role: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    permission: { findMany: ReturnType<typeof vi.fn> };
    user: { findFirst: ReturnType<typeof vi.fn> };
    userRole: {
      upsert: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };
  let authLookupMock: {
    getGlobalRolesAndPermissions: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prismaMock = {
      $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(prismaMock)),
      role: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      permission: { findMany: vi.fn() },
      user: { findFirst: vi.fn() },
      userRole: {
        upsert: vi.fn(),
        count: vi.fn(),
      },
    };
    authLookupMock = {
      getGlobalRolesAndPermissions: vi.fn(),
    };
    const auditMock = { record: vi.fn().mockResolvedValue(undefined) };

    service = new RolesService(
      prismaMock as unknown as PrismaService,
      auditMock as unknown as AuditService,
      authLookupMock as unknown as AuthorizationLookupService,
    );
  });

  it('prevents deleting system-defined roles', async () => {
    prismaMock.role.findUnique.mockResolvedValue({
      id: 'role-sys',
      slug: 'admin',
      isSystem: true,
    });

    await expect(service.delete('role-sys', 'actor-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('blocks privilege escalation when non-super_admin tries to assign unheld permissions', async () => {
    prismaMock.role.findUnique.mockResolvedValue({
      id: 'role-custom',
      slug: 'custom_manager',
      scope: RoleScope.GLOBAL,
      organizationId: null,
    });
    authLookupMock.getGlobalRolesAndPermissions.mockResolvedValue({
      roleSlugs: ['admin'],
      permissionKeys: ['user:read'],
    });
    prismaMock.permission.findMany.mockResolvedValue([
      { id: 'p1', key: 'user:delete' },
    ]);

    await expect(
      service.assignPermissions(
        'role-custom',
        { permissionKeys: ['user:delete'] },
        'actor-admin',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('keeps global roles separate from organization roles and protects last super_admin', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'u1' });
    prismaMock.role.findUnique.mockResolvedValue({
      id: 'role-org',
      slug: 'org_admin',
      scope: RoleScope.ORGANIZATION,
      organizationId: null,
    });

    await expect(
      service.assignRoleToUser('u1', 'role-org', 'actor-1'),
    ).rejects.toThrow(BadRequestException);

    prismaMock.role.findUnique.mockResolvedValue({
      id: 'role-sa',
      slug: 'super_admin',
      scope: RoleScope.GLOBAL,
    });
    authLookupMock.getGlobalRolesAndPermissions.mockResolvedValue({
      roleSlugs: ['super_admin'],
      permissionKeys: [],
    });
    prismaMock.userRole.count.mockResolvedValue(1);

    await expect(
      service.removeRoleFromUser('u1', 'role-sa', 'actor-sa'),
    ).rejects.toThrow(ConflictException);
  });
});
