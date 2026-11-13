import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return fallback;
}

export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @Transform(({ value }) => Number(value ?? 3000))
  @IsInt()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  APP_NAME: string = 'AuthPlatform';

  @IsString()
  @IsOptional()
  APP_URL: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3001';

  @IsString()
  @IsOptional()
  ALLOWED_ORIGINS: string = 'http://localhost:3001,http://localhost:3000';

  @IsString()
  @IsOptional()
  ALLOWED_OAUTH_REDIRECT_URLS: string = 'http://localhost:3001/auth/callback';

  @IsString()
  @IsOptional()
  API_PREFIX: string = '';

  @Transform(({ value }) => parseBoolean(value, false))
  @IsBoolean()
  TRUST_PROXY: boolean = false;

  @IsString()
  @MinLength(10)
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  DIRECT_URL?: string;

  @Transform(({ value }) => parseBoolean(value, false))
  @IsBoolean()
  DATABASE_SSL: boolean = false;

  @Transform(({ value }) => parseBoolean(value, true))
  @IsBoolean()
  DATABASE_SSL_REJECT_UNAUTHORIZED: boolean = true;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  REFRESH_TOKEN_EXPIRES_IN: string = '30d';

  @IsString()
  @MinLength(32)
  COOKIE_SECRET!: string;

  @IsString()
  @IsOptional()
  COOKIE_DOMAIN?: string;

  @IsIn(['lax', 'strict', 'none'])
  @IsOptional()
  COOKIE_SAME_SITE: 'lax' | 'strict' | 'none' = 'lax';

  @Transform(({ value }) => parseBoolean(value, false))
  @IsBoolean()
  COOKIE_SECURE: boolean = false;

  @Transform(({ value }) => parseBoolean(value, true))
  @IsBoolean()
  CSRF_PROTECTION_ENABLED: boolean = true;

  @IsString()
  @IsOptional()
  DEFAULT_USER_ROLE: string = 'customer';

  @Transform(({ value }) => parseBoolean(value, true))
  @IsBoolean()
  REQUIRE_EMAIL_VERIFICATION: boolean = true;

  @Transform(({ value }) => Number(value ?? 8))
  @IsInt()
  @Min(8)
  PASSWORD_MIN_LENGTH: number = 8;

  @Transform(({ value }) => parseBoolean(value, true))
  @IsBoolean()
  PASSWORD_REQUIRE_UPPERCASE: boolean = true;

  @Transform(({ value }) => parseBoolean(value, true))
  @IsBoolean()
  PASSWORD_REQUIRE_LOWERCASE: boolean = true;

  @Transform(({ value }) => parseBoolean(value, true))
  @IsBoolean()
  PASSWORD_REQUIRE_NUMBER: boolean = true;

  @Transform(({ value }) => parseBoolean(value, true))
  @IsBoolean()
  PASSWORD_REQUIRE_SPECIAL: boolean = true;

  @IsString()
  @IsOptional()
  EMAIL_VERIFICATION_EXPIRES_IN: string = '24h';

  @IsString()
  @IsOptional()
  PASSWORD_RESET_EXPIRES_IN: string = '1h';

  @IsString()
  @IsOptional()
  INVITATION_EXPIRES_IN: string = '7d';

  @Transform(({ value }) => parseBoolean(value, true))
  @IsBoolean()
  ENABLE_ORGANIZATIONS: boolean = true;

  @Transform(({ value }) => parseBoolean(value, false))
  @IsBoolean()
  ENABLE_LOGIN_NOTIFICATIONS: boolean = false;

  @Transform(({ value }) => parseBoolean(value, false))
  @IsBoolean()
  ENABLE_MFA: boolean = false;

  @IsString()
  @IsOptional()
  ALLOWED_AUTH_PROVIDERS: string = 'local,google';

  @Transform(({ value }) => Number(value ?? 60000))
  @IsInt()
  @Min(1000)
  THROTTLE_TTL_MS: number = 60000;

  @Transform(({ value }) => Number(value ?? 60))
  @IsInt()
  @Min(1)
  THROTTLE_LIMIT: number = 60;

  @Transform(({ value }) => Number(value ?? 60000))
  @IsInt()
  @Min(1000)
  AUTH_THROTTLE_TTL_MS: number = 60000;

  @Transform(({ value }) => Number(value ?? 10))
  @IsInt()
  @Min(1)
  AUTH_THROTTLE_LIMIT: number = 10;

  @Transform(({ value }) => parseBoolean(value, false))
  @IsBoolean()
  GOOGLE_OAUTH_ENABLED: boolean = false;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL?: string;

  @Transform(({ value }) => parseBoolean(value, false))
  @IsBoolean()
  SMTP_ENABLED: boolean = false;

  @IsString()
  @IsOptional()
  SMTP_HOST: string = 'localhost';

  @Transform(({ value }) => Number(value ?? 1025))
  @IsInt()
  @Min(1)
  SMTP_PORT: number = 1025;

  @Transform(({ value }) => parseBoolean(value, false))
  @IsBoolean()
  SMTP_SECURE: boolean = false;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM: string = 'Auth Platform <no-reply@example.com>';
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((err) => Object.values(err.constraints ?? {}).join(', '))
      .filter(Boolean)
      .join('; ');
    throw new Error(`Environment validation failed: ${messages}`);
  }

  if (
    !validated.DATABASE_URL.startsWith('postgresql://') &&
    !validated.DATABASE_URL.startsWith('postgres://')
  ) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }

  if (validated.GOOGLE_OAUTH_ENABLED) {
    if (
      !validated.GOOGLE_CLIENT_ID ||
      !validated.GOOGLE_CLIENT_SECRET ||
      !validated.GOOGLE_CALLBACK_URL
    ) {
      throw new Error(
        'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL are required when GOOGLE_OAUTH_ENABLED=true',
      );
    }
  }

  if (validated.SMTP_ENABLED) {
    if (!validated.SMTP_HOST || !validated.EMAIL_FROM) {
      throw new Error('SMTP_HOST and EMAIL_FROM are required when SMTP_ENABLED=true');
    }
  }

  if (validated.NODE_ENV === 'production') {
    const weakMarkers = ['change-this', 'dev-only', 'example', 'secret'];
    if (weakMarkers.some((m) => validated.JWT_ACCESS_SECRET.toLowerCase().includes(m))) {
      throw new Error('JWT_ACCESS_SECRET must not use placeholder values in production');
    }
    if (weakMarkers.some((m) => validated.COOKIE_SECRET.toLowerCase().includes(m))) {
      throw new Error('COOKIE_SECRET must not use placeholder values in production');
    }
    if (validated.ALLOWED_ORIGINS.includes('*')) {
      throw new Error('ALLOWED_ORIGINS cannot contain wildcard "*" in production');
    }
    if (validated.COOKIE_SAME_SITE === 'none' && !validated.COOKIE_SECURE) {
      throw new Error('COOKIE_SECURE=true is required when COOKIE_SAME_SITE=none');
    }
  }

  return validated;
}
