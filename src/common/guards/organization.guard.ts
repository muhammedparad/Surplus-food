import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import {
  IS_PUBLIC_KEY,
  ORGANIZATION_HEADER,
  USE_ORGANIZATION_KEY,
} from '../constants/auth.constants.js';
import type { UseOrganizationOptions } from '../decorators/org-context.decorator.js';
import type { RequestWithAuth } from '../interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../services/authorization-lookup.service.js';

interface OrganizationMetadata extends UseOrganizationOptions {
  enabled: boolean;
}

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
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

    const orgMeta = this.reflector.getAllAndOverride<OrganizationMetadata | undefined>(
      USE_ORGANIZATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const paramOrgId =
      (orgMeta?.paramName ? request.params?.[orgMeta.paramName] : undefined) ??
      request.params?.['organizationId'] ??
      request.params?.['orgId'];

    if (!orgMeta?.enabled && !paramOrgId) {
      return true;
    }

    const enableOrganizations =
      this.configService.get<boolean>('auth.enableOrganizations') ?? true;
    if (!enableOrganizations) {
      throw new ForbiddenException('Organization features are disabled in configuration');
    }

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authenticated user is required for organization access');
    }

    const rawHeader = request.headers?.[ORGANIZATION_HEADER];
    const headerOrgId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (paramOrgId && headerOrgId && paramOrgId !== headerOrgId) {
      throw new BadRequestException(
        'Conflicting organization identifier between route parameter and header',
      );
    }

    const targetOrgId = paramOrgId ?? headerOrgId ?? user.activeOrganizationId;
    if (!targetOrgId) {
      throw new BadRequestException(
        'Organization context is required via route parameter, X-Organization-Id header, or active organization',
      );
    }

    const normalizedOrgId = Array.isArray(targetOrgId) ? targetOrgId[0] : targetOrgId;
    if (!isUUID(normalizedOrgId)) {
      throw new BadRequestException('Invalid organization identifier');
    }

    const orgContext = await this.authLookup.getOrganizationMembershipContext(
      user.id,
      normalizedOrgId,
    );
    if (!orgContext) {
      throw new ForbiddenException(
        'You are not an active member of the requested organization',
      );
    }

    request.organizationContext = orgContext;
    return true;
  }
}
