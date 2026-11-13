import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants/auth.constants.js';
import type { RequestWithAuth } from '../interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../services/authorization-lookup.service.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authLookup: AuthorizationLookupService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required for role verification');
    }

    const userRoleSlugs = request.organizationContext
      ? request.organizationContext.roleSlugs
      : (await this.authLookup.getGlobalRolesAndPermissions(user.id)).roleSlugs;

    const hasRole = requiredRoles.some((role) => userRoleSlugs.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient role privileges');
    }

    return true;
  }
}
