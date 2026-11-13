// Prisma 7 configuration file
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Prefer DIRECT_URL for Supabase migrations; fall back to DATABASE_URL for local PostgreSQL
    url: process.env['DIRECT_URL'] || process.env['DATABASE_URL'],
  },
});
