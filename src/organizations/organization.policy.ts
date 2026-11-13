import { Injectable } from '@nestjs/common';
import type { Organization } from '../generated/prisma/client.js';
import type {
  AuthenticatedUser,
  OrganizationContext,
} from '../common/interfaces/authenticated-user.interface.js';
import {
  belongsToOrganization,
  type IAuthorizationPolicy,
} from '../common/interfaces/authorization-policy.interface.js';

export type OrganizationResourceAction = 'read' | 'update' | 'delete';

@Injectable()
export class OrganizationResourcePolicy
  implements IAuthorizationPolicy<Organization, OrganizationResourceAction>
{
  can(
    _actor: AuthenticatedUser,
    action: OrganizationResourceAction,
    resource: Organization,
    organizationContext?: OrganizationContext,
  ): boolean {
    if (!belongsToOrganization(organizationContext, resource.id)) {
      return false;
    }

    const permissionMap: Record<OrganizationResourceAction, string> = {
      read: 'organization:read',
      update: 'organization:update',
      delete: 'organization:delete',
    };

    return organizationContext!.permissionKeys.includes(permissionMap[action]);
  }
}
