import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from '../constants/auth.constants.js';
import type { RequiredPermissionsMetadata } from '../enums/security.enums.js';
import type { RequestWithAuth } from '../interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../services/authorization-lookup.service.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
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

    const metadata = this.reflector.getAllAndOverride<
      RequiredPermissionsMetadata | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!metadata || metadata.permissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required for permission check');
    }

    const effectivePermissions = request.organizationContext
      ? request.organizationContext.permissionKeys
      : (await this.authLookup.getGlobalRolesAndPermissions(user.id)).permissionKeys;

    const permissionSet = new Set(effectivePermissions);
    const hasAccess =
      metadata.mode === 'OR'
        ? metadata.permissions.some((perm) => permissionSet.has(perm))
        : metadata.permissions.every((perm) => permissionSet.has(perm));

    if (!hasAccess) {
      throw new ForbiddenException('Insufficient permissions for this operation');
    }

    return true;
  }
}
