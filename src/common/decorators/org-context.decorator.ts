import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { USE_ORGANIZATION_KEY } from '../constants/auth.constants.js';
import type {
  OrganizationContext,
  RequestWithAuth,
} from '../interfaces/authenticated-user.interface.js';

export interface UseOrganizationOptions {
  paramName?: string;
}

export const UseOrganization = (options: UseOrganizationOptions = {}) =>
  SetMetadata(USE_ORGANIZATION_KEY, {
    enabled: true,
    paramName: options.paramName,
  });

export const CurrentOrganization = createParamDecorator(
  <K extends keyof OrganizationContext>(
    data: K | undefined,
    ctx: ExecutionContext,
  ): OrganizationContext | OrganizationContext[K] | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuth>();
    const orgContext = request.organizationContext;
    if (!orgContext) return undefined;
    return data ? orgContext[data] : orgContext;
  },
);
