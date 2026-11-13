import { ForbiddenException, Injectable } from '@nestjs/common';
import type {
  AuthenticatedUser,
  OrganizationContext,
} from '../interfaces/authenticated-user.interface.js';
import type { IAuthorizationPolicy } from '../interfaces/authorization-policy.interface.js';

@Injectable()
export class PolicyRegistryService {
  private readonly policies = new Map<string, IAuthorizationPolicy<unknown, string>>();

  register<TResource, TAction extends string = string>(
    policyKey: string,
    policy: IAuthorizationPolicy<TResource, TAction>,
  ): void {
    this.policies.set(policyKey, policy as IAuthorizationPolicy<unknown, string>);
  }

  get<TResource, TAction extends string = string>(
    policyKey: string,
  ): IAuthorizationPolicy<TResource, TAction> | undefined {
    return this.policies.get(policyKey) as
      | IAuthorizationPolicy<TResource, TAction>
      | undefined;
  }

  async can<TResource, TAction extends string = string>(
    policyKey: string,
    actor: AuthenticatedUser,
    action: TAction,
    resource: TResource,
    organizationContext?: OrganizationContext,
  ): Promise<boolean> {
    const policy = this.get<TResource, TAction>(policyKey);
    if (!policy) {
      throw new Error(`Authorization policy "${policyKey}" is not registered`);
    }
    return policy.can(actor, action, resource, organizationContext);
  }

  async authorizeOrThrow<TResource, TAction extends string = string>(
    policyKey: string,
    actor: AuthenticatedUser,
    action: TAction,
    resource: TResource,
    organizationContext?: OrganizationContext,
  ): Promise<void> {
    const allowed = await this.can(
      policyKey,
      actor,
      action,
      resource,
      organizationContext,
    );
    if (!allowed) {
      throw new ForbiddenException('You are not authorized to perform this action on the requested resource');
    }
  }
}
