import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import {
  PermissionScope,
  PrismaClient,
  RoleScope,
} from '../src/generated/prisma/client.js';

interface SeedPermissionDef {
  key: string;
  resource: string;
  action: string;
  description: string;
  scope: PermissionScope;
}

interface SeedRoleDef {
  name: string;
  slug: string;
  description: string;
  scope: RoleScope;
  permissionKeys: string[];
}

const SYSTEM_PERMISSIONS: SeedPermissionDef[] = [
  { key: 'user:create', resource: 'user', action: 'create', description: 'Create user accounts', scope: PermissionScope.GLOBAL },
  { key: 'user:read', resource: 'user', action: 'read', description: 'View user accounts and profiles', scope: PermissionScope.GLOBAL },
  { key: 'user:update', resource: 'user', action: 'update', description: 'Update user status and metadata', scope: PermissionScope.GLOBAL },
  { key: 'user:delete', resource: 'user', action: 'delete', description: 'Delete or anonymize user accounts', scope: PermissionScope.GLOBAL },

  { key: 'role:create', resource: 'role', action: 'create', description: 'Create dynamic roles', scope: PermissionScope.BOTH },
  { key: 'role:read', resource: 'role', action: 'read', description: 'List and inspect roles', scope: PermissionScope.BOTH },
  { key: 'role:update', resource: 'role', action: 'update', description: 'Update roles and assign permissions', scope: PermissionScope.BOTH },
  { key: 'role:delete', resource: 'role', action: 'delete', description: 'Delete custom roles', scope: PermissionScope.BOTH },
  { key: 'role:assign', resource: 'role', action: 'assign', description: 'Assign or revoke roles on users/members', scope: PermissionScope.BOTH },

  { key: 'permission:create', resource: 'permission', action: 'create', description: 'Create granular permissions', scope: PermissionScope.GLOBAL },
  { key: 'permission:read', resource: 'permission', action: 'read', description: 'List and inspect permissions', scope: PermissionScope.BOTH },
  { key: 'permission:update', resource: 'permission', action: 'update', description: 'Update permission descriptions', scope: PermissionScope.GLOBAL },

  { key: 'session:read', resource: 'session', action: 'read', description: 'Inspect active sessions', scope: PermissionScope.GLOBAL },
  { key: 'session:revoke', resource: 'session', action: 'revoke', description: 'Revoke sessions across users', scope: PermissionScope.GLOBAL },

  { key: 'audit:read', resource: 'audit', action: 'read', description: 'Read security and administrative audit logs', scope: PermissionScope.BOTH },

  { key: 'organization:create', resource: 'organization', action: 'create', description: 'Create new organizations', scope: PermissionScope.GLOBAL },
  { key: 'organization:read', resource: 'organization', action: 'read', description: 'Read organization details', scope: PermissionScope.BOTH },
  { key: 'organization:update', resource: 'organization', action: 'update', description: 'Update organization settings', scope: PermissionScope.BOTH },
  { key: 'organization:delete', resource: 'organization', action: 'delete', description: 'Delete or suspend organizations', scope: PermissionScope.BOTH },

  { key: 'organization_member:read', resource: 'organization_member', action: 'read', description: 'View organization members and invitations', scope: PermissionScope.ORGANIZATION },
  { key: 'organization_member:invite', resource: 'organization_member', action: 'invite', description: 'Invite new members to an organization', scope: PermissionScope.ORGANIZATION },
  { key: 'organization_member:update', resource: 'organization_member', action: 'update', description: 'Update organization member roles', scope: PermissionScope.ORGANIZATION },
  { key: 'organization_member:remove', resource: 'organization_member', action: 'remove', description: 'Remove members from an organization', scope: PermissionScope.ORGANIZATION },
];

const ALL_PERMISSION_KEYS = SYSTEM_PERMISSIONS.map((p) => p.key);

const SYSTEM_ROLES: SeedRoleDef[] = [
  {
    name: 'Super Admin',
    slug: 'super_admin',
    description: 'Platform-wide super administrator with full access to system security controls',
    scope: RoleScope.GLOBAL,
    permissionKeys: ALL_PERMISSION_KEYS,
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Platform administrator managing users, roles, permissions, organizations, and audit logs',
    scope: RoleScope.GLOBAL,
    permissionKeys: [
      'user:create',
      'user:read',
      'user:update',
      'role:create',
      'role:read',
      'role:update',
      'role:delete',
      'role:assign',
      'permission:create',
      'permission:read',
      'permission:update',
      'session:read',
      'session:revoke',
      'audit:read',
      'organization:create',
      'organization:read',
      'organization:update',
    ],
  },
  {
    name: 'Customer',
    slug: 'customer',
    description: 'Default authenticated user role with self-service profile, session, and organization creation access',
    scope: RoleScope.GLOBAL,
    permissionKeys: ['organization:create'],
  },
  {
    name: 'Organization Owner',
    slug: 'org_owner',
    description: 'Full administrative ownership within a specific organization',
    scope: RoleScope.ORGANIZATION,
    permissionKeys: [
      'organization:read',
      'organization:update',
      'organization:delete',
      'organization_member:read',
      'organization_member:invite',
      'organization_member:update',
      'organization_member:remove',
      'role:create',
      'role:read',
      'role:update',
      'role:delete',
      'role:assign',
      'permission:read',
      'audit:read',
    ],
  },
  {
    name: 'Organization Admin',
    slug: 'org_admin',
    description: 'Organization administrator managing members, invitations, and organization roles',
    scope: RoleScope.ORGANIZATION,
    permissionKeys: [
      'organization:read',
      'organization:update',
      'organization_member:read',
      'organization_member:invite',
      'organization_member:update',
      'organization_member:remove',
      'role:read',
      'role:assign',
      'permission:read',
      'audit:read',
    ],
  },
  {
    name: 'Organization Member',
    slug: 'org_member',
    description: 'Standard organization member with read access to organization workspace and members',
    scope: RoleScope.ORGANIZATION,
    permissionKeys: ['organization:read', 'organization_member:read'],
  },
  {
    name: 'Organization Viewer',
    slug: 'org_viewer',
    description: 'Read-only organization participant',
    scope: RoleScope.ORGANIZATION,
    permissionKeys: ['organization:read'],
  },
];

async function upsertSystemRole(prisma: PrismaClient, roleDef: SeedRoleDef, permissionMap: Map<string, string>) {
  let role = await prisma.role.findFirst({
    where: {
      scope: roleDef.scope,
      slug: roleDef.slug,
      organizationId: null,
    },
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        scope: roleDef.scope,
        isSystem: true,
        organizationId: null,
      },
    });
  } else {
    role = await prisma.role.update({
      where: { id: role.id },
      data: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
    });
  }

  for (const permKey of roleDef.permissionKeys) {
    const permissionId = permissionMap.get(permKey);
    if (!permissionId) continue;

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId,
      },
    });
  }
}

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  const permissionMap = new Map<string, string>();

  for (const perm of SYSTEM_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
        scope: perm.scope,
        isSystem: true,
      },
      create: {
        key: perm.key,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
        scope: perm.scope,
        isSystem: true,
      },
    });
    permissionMap.set(record.key, record.id);
  }

  for (const roleDef of SYSTEM_ROLES) {
    await upsertSystemRole(prisma, roleDef, permissionMap);
  }
}

async function main() {
  await import('dotenv/config');
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL must be set to seed the database');
  }

  const useSsl = process.env.DATABASE_SSL === 'true';
  const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';
  const pool = new pg.Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized } : undefined,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await seedDatabase(prisma);
    console.log('Seeded system permissions and roles successfully (no default admin password created).');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.endsWith('seed.ts');

if (isDirectExecution) {
  main().catch((err) => {
    console.error('Database seed failed:', err);
    process.exit(1);
  });
}
