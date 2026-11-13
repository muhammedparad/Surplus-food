import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';
import {
  InvitationStatus,
  OrganizationStatus,
  RoleScope,
  UserStatus,
} from '../generated/prisma/enums.js';
import type { AuditService } from '../audit/audit.service.js';
import type {
  AuthenticatedUser,
  OrganizationContext,
} from '../common/interfaces/authenticated-user.interface.js';
import type { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import { CryptoService } from '../common/services/crypto.service.js';
import { PolicyRegistryService } from '../common/services/policy-registry.service.js';
import type { EmailService } from '../email/email.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { OrganizationResourcePolicy } from './organization.policy.js';
import { OrganizationsService } from './organizations.service.js';

describe('OrganizationsService', () => {
  const cryptoService = new CryptoService();
  let service: OrganizationsService;
  let prismaMock: {
    $transaction: ReturnType<typeof vi.fn>;
    organization: { findUnique: ReturnType<typeof vi.fn> };
    organizationMember: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    organizationMemberRole: { count: ReturnType<typeof vi.fn> };
    organizationInvitation: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    role: { findFirst: ReturnType<typeof vi.fn> };
    user: { update: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  };
  let authLookupMock: {
    getOrganizationMembershipContext: ReturnType<typeof vi.fn>;
  };

  const actor: AuthenticatedUser = {
    id: 'user-1',
    email: 'owner@example.com',
    name: 'Owner',
    avatarUrl: null,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    activeOrganizationId: null,
    sessionId: 's1',
    tokenVersion: 1,
  };

  const orgContext: OrganizationContext = {
    organizationId: 'org-1',
    organizationSlug: 'acme',
    organizationName: 'Acme',
    memberId: 'mem-1',
    roleSlugs: ['org_admin'],
    permissionKeys: [
      'organization:read',
      'organization_member:invite',
      'organization_member:remove',
    ],
  };

  beforeEach(() => {
    prismaMock = {
      $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(prismaMock)),
      organization: { findUnique: vi.fn() },
      organizationMember: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      organizationMemberRole: { count: vi.fn() },
      organizationInvitation: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
      },
      role: { findFirst: vi.fn() },
      user: { update: vi.fn(), updateMany: vi.fn() },
    };
    authLookupMock = {
      getOrganizationMembershipContext: vi.fn(),
    };

    const configService = {
      get: vi.fn((key: string) => {
        if (key === 'auth.enableOrganizations') return true;
        if (key === 'auth.invitationExpiresIn') return '7d';
        return undefined;
      }),
    } as unknown as ConfigService;

    const policyRegistry = new PolicyRegistryService();
    const orgPolicy = new OrganizationResourcePolicy();

    service = new OrganizationsService(
      prismaMock as unknown as PrismaService,
      cryptoService,
      { sendOrganizationInvitationEmail: vi.fn() } as unknown as EmailService,
      { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService,
      authLookupMock as unknown as AuthorizationLookupService,
      policyRegistry,
      orgPolicy,
      configService,
    );
    service.onModuleInit();
  });

  it('prevents non-members from switching active organization', async () => {
    authLookupMock.getOrganizationMembershipContext.mockResolvedValue(null);
    await expect(service.switchActiveOrganization(actor, 'org-other')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('blocks non-owners from inviting another org_owner', async () => {
    prismaMock.role.findFirst.mockResolvedValue({
      id: 'role-owner',
      slug: 'org_owner',
      name: 'Organization Owner',
      scope: RoleScope.ORGANIZATION,
    });

    await expect(
      service.inviteMember(
        'org-1',
        { email: 'new@example.com', roleSlug: 'org_owner' },
        actor,
        orgContext,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks accepting an invitation issued to a different email address', async () => {
    const raw = cryptoService.generateOpaqueToken(36);
    prismaMock.organizationInvitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      organizationId: 'org-1',
      email: 'someone-else@example.com',
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 60_000),
      organization: { id: 'org-1', status: OrganizationStatus.ACTIVE },
      role: { slug: 'org_member' },
    });

    await expect(service.acceptInvitation(raw, actor)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('prevents removing the last remaining org_owner', async () => {
    prismaMock.organizationMember.findUnique.mockResolvedValue({
      id: 'mem-owner',
      organizationId: 'org-1',
      userId: 'user-owner',
      roles: [{ role: { slug: 'org_owner' } }],
    });
    prismaMock.organizationMemberRole.count.mockResolvedValue(0);

    await expect(
      service.removeMember('org-1', 'user-owner', actor, {
        ...orgContext,
        roleSlugs: ['org_owner'],
      }),
    ).rejects.toThrow(ConflictException);
  });
});
