import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  appName: string;
  appUrl: string;
  frontendUrl: string;
  apiPrefix: string;
  trustProxy: boolean;
  allowedOrigins: string[];
  allowedOAuthRedirectUrls: string[];
  cookie: {
    secret: string;
    domain?: string;
    sameSite: 'lax' | 'strict' | 'none';
    secure: boolean;
  };
  csrfProtectionEnabled: boolean;
  database: {
    url: string;
    directUrl?: string;
    ssl: boolean;
    sslRejectUnauthorized: boolean;
  };
  throttle: {
    ttlMs: number;
    limit: number;
    authTtlMs: number;
    authLimit: number;
  };
}

function splitCsv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const appConfig = registerAs('app', (): AppConfig => {
  const nodeEnv = (process.env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development';
  return {
    nodeEnv,
    port: Number(process.env.PORT ?? 3000),
    appName: process.env.APP_NAME ?? 'AuthPlatform',
    appUrl: process.env.APP_URL ?? 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    apiPrefix: (process.env.API_PREFIX ?? '').replace(/^\/+|\/+$/g, ''),
    trustProxy: process.env.TRUST_PROXY === 'true',
    allowedOrigins: splitCsv(process.env.ALLOWED_ORIGINS),
    allowedOAuthRedirectUrls: splitCsv(process.env.ALLOWED_OAUTH_REDIRECT_URLS),
    cookie: {
      secret: process.env.COOKIE_SECRET ?? '',
      domain: process.env.COOKIE_DOMAIN || undefined,
      sameSite: (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') ?? 'lax',
      secure: process.env.COOKIE_SECURE === 'true' || nodeEnv === 'production',
    },
    csrfProtectionEnabled: process.env.CSRF_PROTECTION_ENABLED !== 'false',
    database: {
      url: process.env.DATABASE_URL ?? '',
      directUrl: process.env.DIRECT_URL || undefined,
      ssl: process.env.DATABASE_SSL === 'true',
      sslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
    },
    throttle: {
      ttlMs: Number(process.env.THROTTLE_TTL_MS ?? 60000),
      limit: Number(process.env.THROTTLE_LIMIT ?? 60),
      authTtlMs: Number(process.env.AUTH_THROTTLE_TTL_MS ?? 60000),
      authLimit: Number(process.env.AUTH_THROTTLE_LIMIT ?? 10),
    },
  };
});
