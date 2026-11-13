import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import pg from 'pg';

const PRISMA_CLI = resolve(process.cwd(), 'node_modules/prisma/build/index.js');
const VITEST_CLI = resolve(process.cwd(), 'node_modules/vitest/vitest.mjs');

async function canConnect(connectionString: string, useSsl: boolean): Promise<boolean> {
  const pool = new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 1500,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await pool.end().catch(() => undefined);
  }
}

async function ensureDatabaseAndMigrations(connectionString: string): Promise<void> {
  const parsed = new URL(connectionString);
  const dbName = parsed.pathname.replace(/^\//, '');
  if (!dbName || !/^[a-zA-Z0-9_]+$/.test(dbName)) {
    return;
  }

  const adminUrl = new URL(connectionString);
  adminUrl.pathname = '/template1';

  const adminPool = new pg.Pool({ connectionString: adminUrl.toString() });
  try {
    const exists = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (exists.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await adminPool.end();
  }

  const migrate = spawnSync(process.execPath, [PRISMA_CLI, 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
      DIRECT_URL: process.env.DIRECT_URL ?? connectionString,
    },
  });
  if (migrate.status !== 0) {
    throw new Error(`prisma migrate deploy exited with code ${migrate.status ?? 1}`);
  }
}

async function waitForPostgres(
  adminConnectionString: string,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await canConnect(adminConnectionString, false)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  return false;
}

async function main(): Promise<void> {
  if (existsSync('.env.test')) {
    loadDotenv({ path: '.env.test', override: true });
  } else if (existsSync('.env')) {
    loadDotenv({ path: '.env', override: false });
  }

  process.env.NODE_ENV = 'test';

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured in .env.test or environment');
  }

  const useSsl = process.env.DATABASE_SSL === 'true';
  let startedPrismaDev: ChildProcess | null = null;

  try {
    const alreadyReachable = await canConnect(databaseUrl, useSsl);
    if (!alreadyReachable) {
      const parsed = new URL(databaseUrl);
      const isLocalPrismaDev =
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
        parsed.port === '51214';

      if (!isLocalPrismaDev) {
        throw new Error(
          `Cannot connect to PostgreSQL test database (${parsed.hostname}:${parsed.port || 5432}). Check DATABASE_URL in .env.test.`,
        );
      }

      console.log('Starting local Prisma Postgres (auth-dev) for E2E test suite...');
      startedPrismaDev = spawn(
        process.execPath,
        [
          PRISMA_CLI,
          'dev',
          '-n',
          'auth-dev',
          '-P',
          '51214',
          '-p',
          '51213',
          '--shadow-db-port',
          '51215',
        ],
        {
          stdio: ['ignore', 'ignore', 'pipe'],
        },
      );

      let startupErr = '';
      startedPrismaDev.stderr?.on('data', (chunk: Buffer) => {
        startupErr += chunk.toString('utf8');
      });

      const adminUrl = new URL(databaseUrl);
      adminUrl.pathname = '/template1';

      const ready = await waitForPostgres(adminUrl.toString(), 30_000);
      if (!ready) {
        throw new Error(
          `Timed out waiting for local Prisma Postgres on localhost:51214. ${startupErr}`.trim(),
        );
      }

      await ensureDatabaseAndMigrations(databaseUrl);
    }

    const result = spawnSync(
      process.execPath,
      [VITEST_CLI, 'run', '--config', './vitest.config.e2e.ts'],
      {
        stdio: 'inherit',
        env: process.env,
      },
    );

    process.exitCode = result.status ?? 1;
  } finally {
    if (startedPrismaDev) {
      spawnSync(process.execPath, [PRISMA_CLI, 'dev', 'stop', 'auth-dev'], {
        stdio: 'ignore',
      });
      if (!startedPrismaDev.killed) {
        startedPrismaDev.kill();
      }
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
