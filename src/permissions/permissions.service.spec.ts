import { BadRequestException, ConflictException } from '@nestjs/common';
import { vi } from 'vitest';
import { PermissionScope } from '../generated/prisma/enums.js';
import type { AuditService } from '../audit/audit.service.js';
import type { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { PermissionsService } from './permissions.service.js';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prismaMock: {
    permission: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
  };
  let authLookupMock: {
    getGlobalRolesAndPermissions: ReturnType<typeof vi.fn>;
    getOrganizationMembershipContext: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prismaMock = {
      permission: {
        findUnique: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
      },
    };
    authLookupMock = {
      getGlobalRolesAndPermissions: vi.fn(),
      getOrganizationMembershipContext: vi.fn(),
    };
    const auditMock = { record: vi.fn().mockResolvedValue(undefined) };

    service = new PermissionsService(
      prismaMock as unknown as PrismaService,
      auditMock as unknown as AuditService,
      authLookupMock as unknown as AuthorizationLookupService,
    );
  });

  it('creates granular resource:action permissions and rejects malformed or duplicate keys', async () => {
    await expect(
      service.create({ key: 'invalidformat' }, 'actor-1'),
    ).rejects.toThrow(BadRequestException);

    prismaMock.permission.findUnique.mockResolvedValue({ id: 'p1', key: 'billing:read' });
    await expect(
      service.create({ key: 'billing:read' }, 'actor-1'),
    ).rejects.toThrow(ConflictException);

    prismaMock.permission.findUnique.mockResolvedValue(null);
    prismaMock.permission.create.mockResolvedValue({
      id: 'p2',
      key: 'invoice:create',
      resource: 'invoice',
      action: 'create',
      scope: PermissionScope.ORGANIZATION,
    });

    const created = await service.create(
      { key: 'invoice:create', description: 'Create invoices', scope: PermissionScope.ORGANIZATION },
      'actor-1',
    );
    expect(created.key).toBe('invoice:create');
  });

  it('registers feature permissions idempotently for reusable SaaS integration', async () => {
    prismaMock.permission.upsert.mockResolvedValue({});
    await service.registerModulePermissions([
      { key: 'project:read', description: 'Read projects' },
      { key: 'project:write', description: 'Write projects', scope: PermissionScope.ORGANIZATION },
    ]);
    expect(prismaMock.permission.upsert).toHaveBeenCalledTimes(2);
  });
});
