import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants/auth.constants.js';
import type {
  PermissionMatchMode,
  RequiredPermissionsMetadata,
} from '../enums/security.enums.js';

export type PermissionKey = `${string}:${string}`;

export interface RequirePermissionsOptions {
  mode: PermissionMatchMode;
}

export function RequirePermissions(
  ...permissions: PermissionKey[]
): MethodDecorator & ClassDecorator;
export function RequirePermissions(
  ...args: [...PermissionKey[], RequirePermissionsOptions]
): MethodDecorator & ClassDecorator;
export function RequirePermissions(
  ...args: Array<PermissionKey | RequirePermissionsOptions>
): MethodDecorator & ClassDecorator {
  let mode: PermissionMatchMode = 'AND';
  let permissions: string[];

  const last = args[args.length - 1];
  if (typeof last === 'object' && last !== null && 'mode' in last) {
    mode = last.mode;
    permissions = args.slice(0, -1) as string[];
  } else {
    permissions = args as string[];
  }

  const metadata: RequiredPermissionsMetadata = {
    permissions: permissions.map((p) => p.trim().toLowerCase()),
    mode,
  };

  return SetMetadata(PERMISSIONS_KEY, metadata);
}
