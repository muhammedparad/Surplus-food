import { registerAs } from '@nestjs/config';

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

export interface AuthConfig {
  jwtAccessSecret: string;
  jwtAccessExpiresIn: string;
  refreshTokenExpiresIn: string;
  emailVerificationExpiresIn: string;
  passwordResetExpiresIn: string;
  invitationExpiresIn: string;
  defaultUserRole: string;
  requireEmailVerification: boolean;
  passwordPolicy: PasswordPolicyConfig;
  enableOrganizations: boolean;
  enableLoginNotifications: boolean;
  enableMfa: boolean;
  allowedAuthProviders: string[];
  google: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
}

export const authConfig = registerAs('auth', (): AuthConfig => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
  emailVerificationExpiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN ?? '24h',
  passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN ?? '1h',
  invitationExpiresIn: process.env.INVITATION_EXPIRES_IN ?? '7d',
  defaultUserRole: (process.env.DEFAULT_USER_ROLE ?? 'customer').trim().toLowerCase(),
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
  passwordPolicy: {
    minLength: Number(process.env.PASSWORD_MIN_LENGTH ?? 8),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireNumber: process.env.PASSWORD_REQUIRE_NUMBER !== 'false',
    requireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
  },
  enableOrganizations: process.env.ENABLE_ORGANIZATIONS !== 'false',
  enableLoginNotifications: process.env.ENABLE_LOGIN_NOTIFICATIONS === 'true',
  enableMfa: process.env.ENABLE_MFA === 'true',
  allowedAuthProviders: (process.env.ALLOWED_AUTH_PROVIDERS ?? 'local,google')
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean),
  google: {
    enabled: process.env.GOOGLE_OAUTH_ENABLED === 'true',
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback',
  },
}));
