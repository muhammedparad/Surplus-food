import { BadRequestException, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { vi } from 'vitest';
import { UserStatus } from '../../generated/prisma/enums.js';
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
  ROLES_KEY,
  USE_ORGANIZATION_KEY,
} from '../constants/auth.constants.js';
import type { AuthorizationLookupService } from '../services/authorization-lookup.service.js';
import { CryptoService } from '../services/crypto.service.js';
import { CsrfGuard } from './csrf.guard.js';
import { OrganizationGuard } from './organization.guard.js';
import { PermissionsGuard } from './permissions.guard.js';
import { RolesGuard } from './roles.guard.js';

function createHttpContext(req: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('Authorization & Security Guards', () => {
  describe('PermissionsGuard', () => {
    it('supports AND and OR permission semantics using DB lookup', async () => {
      const reflector = new Reflector();
      vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === PERMISSIONS_KEY) {
          return { permissions: ['event:read', 'event:update'], mode: 'AND' };
        }
        return undefined;
      });

      const authLookup = {
        getGlobalRolesAndPermissions: vi.fn().mockResolvedValue({
          roleSlugs: ['editor'],
          permissionKeys: ['event:read'],
        }),
      } as unknown as AuthorizationLookupService;

      const guard = new PermissionsGuard(reflector, authLookup);
      const ctx = createHttpContext({ user: { id: 'u1' } });

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);

      vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === PERMISSIONS_KEY) {
          return { permissions: ['event:read', 'event:update'], mode: 'OR' };
        }
        return undefined;
      });

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('uses organizationContext permissions instead of global permissions on org routes', async () => {
      const reflector = new Reflector();
      vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === PERMISSIONS_KEY) {
          return { permissions: ['organization:update'], mode: 'AND' };
        }
        return undefined;
      });

      const authLookup = {
        getGlobalRolesAndPermissions: vi.fn().mockResolvedValue({
          roleSlugs: ['super_admin'],
          permissionKeys: ['organization:update'],
        }),
      } as unknown as AuthorizationLookupService;

      const guard = new PermissionsGuard(reflector, authLookup);
      const ctx = createHttpContext({
        user: { id: 'u1' },
        organizationContext: {
          organizationId: 'org-1',
          organizationSlug: 'acme',
          organizationName: 'Acme',
          memberId: 'mem-1',
          roleSlugs: ['org_viewer'],
          permissionKeys: ['organization:read'],
        },
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('OrganizationGuard', () => {
    it('blocks conflicting organization IDs and non-members', async () => {
      const reflector = new Reflector();
      vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === USE_ORGANIZATION_KEY) return { enabled: true, paramName: 'id' };
        return undefined;
      });

      const config = {
        get: vi.fn(() => true),
      } as unknown as ConfigService;

      const org1 = '11111111-1111-4111-8111-111111111111';
      const org2 = '22222222-2222-4222-8222-222222222222';

      const authLookup = {
        getOrganizationMembershipContext: vi.fn().mockResolvedValue(null),
      } as unknown as AuthorizationLookupService;

      const guard = new OrganizationGuard(reflector, config, authLookup);

      await expect(
        guard.canActivate(
          createHttpContext({
            user: { id: 'u1', status: UserStatus.ACTIVE },
            params: { id: org1 },
            headers: { 'x-organization-id': org2 },
          }),
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        guard.canActivate(
          createHttpContext({
            user: { id: 'u1', status: UserStatus.ACTIVE },
            params: { id: org1 },
            headers: {},
          }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('RolesGuard', () => {
    it('evaluates organization roles when organizationContext is set', async () => {
      const reflector = new Reflector();
      vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['org_admin'];
        return undefined;
      });
      const authLookup = {} as AuthorizationLookupService;
      const guard = new RolesGuard(reflector, authLookup);

      await expect(
        guard.canActivate(
          createHttpContext({
            user: { id: 'u1' },
            organizationContext: {
              organizationId: 'org-1',
              roleSlugs: ['org_member'],
              permissionKeys: [],
            },
          }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CsrfGuard', () => {
    it('enforces CSRF header on cookie-authenticated mutations while allowing Bearer requests', () => {
      const reflector = new Reflector();
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const config = {
        get: vi.fn((key: string) => {
          if (key === 'app.csrfProtectionEnabled') return true;
          if (key === 'app.allowedOrigins') return ['http://localhost:3001'];
          return undefined;
        }),
      } as unknown as ConfigService;

      const guard = new CsrfGuard(reflector, config, new CryptoService());

      expect(
        guard.canActivate(
          createHttpContext({
            method: 'POST',
            headers: { authorization: 'Bearer jwt-token' },
            cookies: {},
          }),
        ),
      ).toBe(true);

      expect(() =>
        guard.canActivate(
          createHttpContext({
            method: 'POST',
            headers: { origin: 'http://localhost:3001' },
            cookies: { [ACCESS_TOKEN_COOKIE]: 'cookie-jwt', [CSRF_TOKEN_COOKIE]: 'abc' },
          }),
        ),
      ).toThrow(ForbiddenException);

      expect(
        guard.canActivate(
          createHttpContext({
            method: 'POST',
            headers: {
              origin: 'http://localhost:3001',
              [CSRF_HEADER_NAME]: 'abc',
            },
            cookies: { [ACCESS_TOKEN_COOKIE]: 'cookie-jwt', [CSRF_TOKEN_COOKIE]: 'abc' },
          }),
        ),
      ).toBe(true);
    });
  });
});
