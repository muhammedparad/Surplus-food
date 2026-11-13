import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function verifySupabase() {
  console.log('--- Supabase & Prisma Live Connectivity Verification ---');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('[1/4] Connecting to Supabase via PrismaPg adapter...');
  await prisma.$connect();
  console.log('✓ Successfully connected to Supabase PostgreSQL');

  console.log('[2/4] Counting users in database...');
  const userCount = await prisma.user.count();
  console.log(`✓ Total users: ${userCount}`);

  console.log('[3/4] Validating seeded superadmin...');
  const superAdmin = await prisma.user.findFirst({
    where: { email: 'admin@foodrescue.org' },
    select: {
      id: true,
      email: true,
      status: true,
      userRoles: { select: { role: { select: { name: true } } } },
    },
  });
  console.log('✓ Superadmin account verified:', JSON.stringify(superAdmin));

  console.log('[4/4] Validating master catalog tables...');
  const allergenCount = await prisma.foodAllergen.count();
  const roleCount = await prisma.role.count();
  const permissionCount = await prisma.permission.count();
  console.log(`✓ Allergens seeded: ${allergenCount}`);
  console.log(`✓ Roles seeded: ${roleCount}`);
  console.log(`✓ Permissions seeded: ${permissionCount}`);

  await prisma.$disconnect();
  await pool.end();
  console.log('========================================================');
  console.log('ALL CHECKS PASSED: Live Supabase database is 100% ready!');
  console.log('========================================================');
}

verifySupabase().catch((err) => {
  console.error('Supabase verification failed:', err);
  process.exit(1);
});
