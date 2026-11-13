import { UserStatus } from '../generated/prisma/enums.js';
import type {
  AuthenticatedUser,
  OrganizationContext,
} from '../common/interfaces/authenticated-user.interface.js';
import {
  type ExampleProjectResource,
  ExampleProjectPolicy,
} from './resource-authorization-example.js';

describe('ExampleProjectPolicy (Resource & Tenant Authorization)', () => {
  const policy = new ExampleProjectPolicy();

  const actor: AuthenticatedUser = {
    id: 'user-a',
    email: 'a@example.com',
    name: 'User A',
    avatarUrl: null,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    activeOrganizationId: 'org-x',
    sessionId: 's1',
    tokenVersion: 1,
  };

  const orgXContext: OrganizationContext = {
    organizationId: 'org-x',
    organizationSlug: 'org-x',
    organizationName: 'Org X',
    memberId: 'mem-a',
    roleSlugs: ['editor'],
    permissionKeys: ['project:read', 'project:update_own'],
  };

  const ownProjectInOrgX: ExampleProjectResource = {
    id: 'proj-1',
    organizationId: 'org-x',
    ownerId: 'user-a',
    name: 'Owned Project',
  };

  const otherProjectInOrgX: ExampleProjectResource = {
    id: 'proj-2',
    organizationId: 'org-x',
    ownerId: 'user-b',
    name: 'Teammate Project',
  };

  const projectInOrgY: ExampleProjectResource = {
    id: 'proj-3',
    organizationId: 'org-y',
    ownerId: 'user-a',
    name: 'Cross-Tenant Project',
  };

  it('allows owner to update own project in same organization, blocks updating teammate project', () => {
    expect(policy.can(actor, 'update', ownProjectInOrgX, orgXContext)).toBe(true);
    expect(policy.can(actor, 'update', otherProjectInOrgX, orgXContext)).toBe(false);
  });

  it('blocks cross-tenant access even if user owns the resource in another organization', () => {
    expect(policy.can(actor, 'read', projectInOrgY, orgXContext)).toBe(false);
    expect(policy.can(actor, 'update', projectInOrgY, orgXContext)).toBe(false);
  });
});
