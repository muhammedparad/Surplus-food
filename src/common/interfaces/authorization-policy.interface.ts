import type {
  AuthenticatedUser,
  OrganizationContext,
} from './authenticated-user.interface.js';

export interface IAuthorizationPolicy<TResource, TAction extends string = string> {
  can(
    actor: AuthenticatedUser,
    action: TAction,
    resource: TResource,
    organizationContext?: OrganizationContext,
  ): Promise<boolean> | boolean;
}

export function isResourceOwner(actorId: string, ownerId: string | null | undefined): boolean {
  return Boolean(ownerId && actorId === ownerId);
}

export function belongsToOrganization(
  organizationContext: OrganizationContext | undefined,
  resourceOrganizationId: string | null | undefined,
): boolean {
  return Boolean(
    organizationContext &&
      resourceOrganizationId &&
      organizationContext.organizationId === resourceOrganizationId,
  );
}
