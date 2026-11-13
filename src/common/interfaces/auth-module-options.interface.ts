import type { PermissionScope } from '../../generated/prisma/enums.js';

export interface PermissionDefinition {
  key: string;
  description: string;
  scope?: PermissionScope;
}

export interface AuthPlatformModuleOptions {
  defaultUserRole?: string;
  requireEmailVerification?: boolean;
  enableOrganizations?: boolean;
  enableLoginNotifications?: boolean;
  enableMfa?: boolean;
  allowedAuthProviders?: string[];
  customPermissions?: PermissionDefinition[];
}

export interface ExtensionImplementationStatus {
  totpMfa: 'planned_hook_only';
  recoveryCodes: 'planned_hook_only';
  passkeysWebAuthn: 'planned_hook_only';
  magicLinkAuth: 'planned_hook_only';
  accountLockoutPolicy: 'planned_hook_only';
  loginNotifications: 'implemented_configurable';
}
