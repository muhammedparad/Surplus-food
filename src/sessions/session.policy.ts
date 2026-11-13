import { Injectable } from '@nestjs/common';
import type { Session } from '../generated/prisma/client.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import {
  type IAuthorizationPolicy,
  isResourceOwner,
} from '../common/interfaces/authorization-policy.interface.js';
import { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';

export type SessionAction = 'read' | 'revoke';

@Injectable()
export class SessionPolicy implements IAuthorizationPolicy<Session, SessionAction> {
  constructor(private readonly authLookup: AuthorizationLookupService) {}

  async can(
    actor: AuthenticatedUser,
    action: SessionAction,
    resource: Session,
  ): Promise<boolean> {
    if (isResourceOwner(actor.id, resource.userId)) {
      return true;
    }

    const { permissionKeys } = await this.authLookup.getGlobalRolesAndPermissions(actor.id);
    const requiredPermission = action === 'read' ? 'session:read' : 'session:revoke';
    return permissionKeys.includes(requiredPermission);
  }
}
