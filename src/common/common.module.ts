import { Global, Module } from '@nestjs/common';
import { CsrfGuard } from './guards/csrf.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { OrganizationGuard } from './guards/organization.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthorizationLookupService } from './services/authorization-lookup.service.js';
import { CryptoService } from './services/crypto.service.js';
import { PolicyRegistryService } from './services/policy-registry.service.js';

@Global()
@Module({
  providers: [
    CryptoService,
    AuthorizationLookupService,
    PolicyRegistryService,
    JwtAuthGuard,
    OrganizationGuard,
    RolesGuard,
    PermissionsGuard,
    CsrfGuard,
  ],
  exports: [
    CryptoService,
    AuthorizationLookupService,
    PolicyRegistryService,
    JwtAuthGuard,
    OrganizationGuard,
    RolesGuard,
    PermissionsGuard,
    CsrfGuard,
  ],
})
export class CommonModule {}
