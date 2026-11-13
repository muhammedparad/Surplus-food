/**
 * Reusable Integration Reference Example (Not loaded into AppModule by default).
 *
 * Demonstrates how a downstream SaaS feature module can:
 * 1. Register custom domain permissions via PermissionsService / AuthModule.forFeaturePermissions.
 * 2. Define a resource-level policy combining tenant isolation and ownership checks.
 * 3. Protect endpoints using @UseOrganization() and @RequirePermissions() without
 *    putting authorization logic inside controllers.
 */
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { PermissionScope } from '../generated/prisma/enums.js';
import type {
  AuthenticatedUser,
  OrganizationContext,
} from '../common/interfaces/authenticated-user.interface.js';
import {
  belongsToOrganization,
  type IAuthorizationPolicy,
  isResourceOwner,
} from '../common/interfaces/authorization-policy.interface.js';
import { PolicyRegistryService } from '../common/services/policy-registry.service.js';
import { PermissionsService } from '../permissions/permissions.service.js';

export interface ExampleProjectResource {
  id: string;
  organizationId: string;
  ownerId: string;
  name: string;
}

export type ExampleProjectAction = 'read' | 'update' | 'delete';

@Injectable()
export class ExampleProjectPolicy
  implements IAuthorizationPolicy<ExampleProjectResource, ExampleProjectAction>
{
  can(
    actor: AuthenticatedUser,
    action: ExampleProjectAction,
    resource: ExampleProjectResource,
    organizationContext?: OrganizationContext,
  ): boolean {
    // 1. Strict tenant boundary check: block cross-organization access immediately
    if (!belongsToOrganization(organizationContext, resource.organizationId)) {
      return false;
    }

    const permissions = new Set(organizationContext?.permissionKeys ?? []);

    if (action === 'read') {
      return permissions.has('project:read') || isResourceOwner(actor.id, resource.ownerId);
    }

    if (action === 'update') {
      return (
        permissions.has('project:manage_all') ||
        (permissions.has('project:update_own') && isResourceOwner(actor.id, resource.ownerId))
      );
    }

    return permissions.has('project:delete');
  }
}

@Injectable()
export class ExampleFeatureRegistrar implements OnModuleInit {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly policyRegistry: PolicyRegistryService,
    private readonly projectPolicy: ExampleProjectPolicy,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.permissionsService.registerModulePermissions([
      {
        key: 'project:read',
        description: 'View projects in organization',
        scope: PermissionScope.ORGANIZATION,
      },
      {
        key: 'project:update_own',
        description: 'Edit own projects in organization',
        scope: PermissionScope.ORGANIZATION,
      },
      {
        key: 'project:manage_all',
        description: 'Manage any project in organization',
        scope: PermissionScope.ORGANIZATION,
      },
      {
        key: 'project:delete',
        description: 'Delete projects in organization',
        scope: PermissionScope.ORGANIZATION,
      },
    ]);

    this.policyRegistry.register('example_project', this.projectPolicy);
  }
}
