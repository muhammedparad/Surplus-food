import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient, RoleScope, UserStatus } from '../src/generated/prisma/client.js';

function validateStrongPassword(password: string): void {
  if (password.length < 12) {
    throw new Error('Bootstrap admin password must be at least 12 characters long');
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error('Bootstrap admin password must include uppercase, lowercase, number, and special character');
  }
}

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL is required');
  }

  const useSsl = process.env.DATABASE_SSL === 'true';
  const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';
  const pool = new pg.Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized } : undefined,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const rl = readline.createInterface({ input, output });

  try {
    const superAdminRole = await prisma.role.findFirst({
      where: { scope: RoleScope.GLOBAL, slug: 'super_admin', organizationId: null },
    });
    if (!superAdminRole) {
      throw new Error('System role "super_admin" not found. Run "npm run prisma:seed" first.');
    }

    const existingSuperAdmins = await prisma.userRole.count({
      where: { roleId: superAdminRole.id },
    });
    if (existingSuperAdmins > 0 && process.env.ALLOW_ADDITIONAL_SUPER_ADMIN !== 'true') {
      throw new Error(
        'A super_admin user already exists. Set ALLOW_ADDITIONAL_SUPER_ADMIN=true explicitly if you intend to bootstrap another.',
      );
    }

    const rawEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || (await rl.question('Admin Email: '));
    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new Error('A valid email address is required');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      await prisma.$transaction(async (tx) => {
        await tx.userRole.upsert({
          where: { userId_roleId: { userId: existingUser.id, roleId: superAdminRole.id } },
          update: {},
          create: { userId: existingUser.id, roleId: superAdminRole.id },
        });
        await tx.auditLog.create({
          data: {
            actorId: existingUser.id,
            action: 'ADMIN_BOOTSTRAP_PROMOTED',
            targetType: 'User',
            targetId: existingUser.id,
            metadata: { roleSlug: 'super_admin' },
          },
        });
      });
      console.log(`Promoted existing user ${email} to super_admin.`);
      return;
    }

    const name = (process.env.BOOTSTRAP_ADMIN_NAME || (await rl.question('Admin Name: '))).trim();
    if (!name) {
      throw new Error('Admin name is required');
    }

    const password =
      process.env.BOOTSTRAP_ADMIN_PASSWORD || (await rl.question('Admin Password (min 12 chars, complex): '));
    validateStrongPassword(password);

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: superAdminRole.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'ADMIN_BOOTSTRAP_CREATED',
          targetType: 'User',
          targetId: user.id,
          metadata: { roleSlug: 'super_admin' },
        },
      });
    });

    console.log(`Bootstrapped initial super_admin account for ${email}.`);
  } finally {
    rl.close();
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Bootstrap failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
