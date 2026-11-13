export const IS_PUBLIC_KEY = 'auth:isPublic';
export const ROLES_KEY = 'auth:roles';
export const PERMISSIONS_KEY = 'auth:permissions';
export const REQUIRE_VERIFIED_EMAIL_KEY = 'auth:requireVerifiedEmail';
export const USE_ORGANIZATION_KEY = 'auth:useOrganization';
export const SKIP_CSRF_KEY = 'auth:skipCsrf';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CSRF_TOKEN_COOKIE = 'csrf_token';
export const OAUTH_TX_COOKIE = 'oauth_tx';

export const CSRF_HEADER_NAME = 'x-csrf-token';
export const ORGANIZATION_HEADER = 'x-organization-id';
export const CLIENT_TYPE_HEADER = 'x-client-type';

/**
 * Valid Argon2id hash of an arbitrary unguessable string used solely to equalize
 * password verification timing when an email address does not exist.
 */
export const DUMMY_ARGON2_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$fVnUdM+g8lJKc/RUbiPQ0g$YSSk6WwhLtCzc0JcEilD5TA7iE+eOspk+Sw0fdgFeIs';

export const SYSTEM_PROTECTED_ROLE_SLUGS = new Set([
  'super_admin',
  'admin',
  'customer',
  'org_owner',
  'org_admin',
  'org_member',
  'org_viewer',
]);
