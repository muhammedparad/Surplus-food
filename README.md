# Reusable NestJS Authentication & Authorization Platform

A production-oriented, modular-monolith authentication, session security, dynamic RBAC, multi-tenant organization access control, resource policy, and audit logging foundation built with **NestJS**, **TypeScript (strict mode)**, **PostgreSQL**, and **Prisma ORM**.

Designed to run locally without Docker, deploy directly to **Render**, use **Supabase PostgreSQL** as the managed database, and serve as a reusable foundation across multiple SaaS applications.

---

## 1. Architecture Overview

The application is structured as a modular monolith with strict separation of concerns and zero circular dependencies:

- **`PrismaModule` (`@Global`)**: Manages PostgreSQL pooling via `@prisma/adapter-pg` and `pg.Pool`, TLS options, and graceful shutdown hooks.
- **`CommonModule` (`@Global`)**: Provides `CryptoService` (Argon2id, SHA-256 token hashing, PKCE S256, HMAC signed state/link payloads), `AuthorizationLookupService` (database-backed role/permission resolution), `PolicyRegistryService` (resource-level authorization), reusable decorators, security guards, exception filter, and safe request logging interceptor.
- **`AuthModule`**: Email/password registration and login, JWT access tokens, rotating refresh tokens, Google OAuth 2.0 / OIDC (PKCE + `state` + `nonce` + ID token signature/issuer/audience verification), secure account linking/unlinking, email verification, and password recovery.
- **`SessionsModule`**: Database-backed session lifecycle, concurrency-safe transactional refresh-token rotation, compromised token family reuse detection, individual/bulk session revocation, and `SessionPolicy`.
- **`UsersModule`**: Self-service profile management, password changes (with configurable session revocation), and administrative user listing, suspension/activation, and safe account deletion/anonymization.
- **`RolesModule` & `PermissionsModule`**: Dynamic database-managed roles (`GLOBAL` vs `ORGANIZATION`), granular `resource:action` permissions, `AND`/`OR` permission evaluation, system role deletion protection, and privilege-escalation prevention.
- **`OrganizationsModule`**: Multi-tenant organizations, memberships, expiring single-use invitation tokens, member role management, active organization switching, and strict tenant isolation.
- **`EmailModule`**: SMTP delivery via `nodemailer` decoupled behind a queue-ready `EMAIL_DISPATCHER` interface and HTML-escaped email templates.
- **`AuditModule` (`@Global`)**: Sanitized security audit trail (`audit_logs`) with sensitive-key redaction and tenant-scoped query endpoints.
- **`HealthModule`**: Public `GET /health` endpoint reporting application and PostgreSQL readiness without exposing credentials.

### Implementation Status of Optional Extensions

| Feature | Status | Details |
| --- | --- | --- |
| Login Notification Emails | **Implemented (Configurable)** | Controlled via `ENABLE_LOGIN_NOTIFICATIONS=true` |
| TOTP Two-Factor Authentication | **Extension Hook Only** | Config toggle `ENABLE_MFA` and interface boundary defined; TOTP enrollment/challenge tables & endpoints not yet implemented |
| Recovery Codes | **Planned Extension** | Not implemented |
| Account Lockout Policies | **Planned Extension** | Currently mitigated via endpoint rate limiting (`@Throttle`) and audit tracking; lockout counter/cooldown not yet implemented |
| Passkeys / WebAuthn | **Planned Extension** | Extensible via `AuthProvider` and `AuthProviderAccount`; not implemented |
| Magic-Link Authentication | **Planned Extension** | Not implemented |

---

## 2. Project Structure

```text
prisma/
  schema.prisma                   # Normalized PostgreSQL schema (15 models)
  seed.ts                         # Idempotent system permissions & roles seed
  supabase-hardening.sql          # Optional RLS + PostgREST privilege lockdown for Supabase
  migrations/                     # Prisma SQL migrations
scripts/
  bootstrap-admin.ts              # Secure CLI bootstrap script for initial super_admin
src/
  auth/                           # Auth controller, AuthService, GoogleOAuthService, JwtStrategy, TokenIssuerService
  audit/                          # AuditService, AuditController, DTOs
  common/                         # Guards, decorators, filters, interceptors, CryptoService, PolicyRegistryService
  config/                         # Validated env config (app, auth, mail)
  email/                          # EmailService, SmtpEmailDispatcher, HTML/text templates
  examples/                       # Resource policy & feature permission registration reference
  health/                         # GET /health readiness endpoint
  organizations/                  # Organizations CRUD, memberships, invitations, switching, policy
  permissions/                    # Dynamic granular permissions CRUD & module registration helper
  prisma/                         # PrismaService & PrismaModule
  roles/                          # Dynamic roles CRUD, role-permission & user-role assignment
  sessions/                       # DB sessions, transactional rotation, reuse detection, SessionPolicy
  users/                          # Profile, password change, admin user management
  app.module.ts
  main.ts
test/
  app.e2e-spec.ts                 # PostgreSQL-backed integration & E2E tests
```

---

## 3. Database Schema & Relationships

- **`User`** (`users`): UUID PK, normalized unique `email`, nullable `passwordHash` (for Google-only accounts), `status` (`ACTIVE | INACTIVE | SUSPENDED | DELETED`), `emailVerifiedAt`, `activeOrganizationId`, `tokenVersion`, `deletedAt`.
- **`AuthProviderAccount`** (`auth_provider_accounts`): Stores `(provider, providerUserId)` uniquely and separately from `User.email` (`@@unique([provider, providerUserId])`, `@@unique([userId, provider])`).
- **`Role`** (`roles`): Separates `scope` (`GLOBAL` | `ORGANIZATION`), `isSystem` flag, and optional `organizationId` with a partial unique index ensuring global/template role slugs never collide.
- **`Permission`** (`permissions`): Unique `resource:action` `key`, `resource`, `action`, `scope` (`GLOBAL | ORGANIZATION | BOTH`).
- **`RolePermission`** (`role_permissions`) & **`UserRole`** (`user_roles`): Unique composite constraints prevent duplicate role-permission or user-role assignments.
- **`Organization`** (`organizations`), **`OrganizationMember`** (`organization_members`), **`OrganizationMemberRole`** (`organization_member_roles`): Multi-tenant memberships (`@@unique([organizationId, userId])`) allowing a single user to hold distinct roles across different organizations.
- **`OrganizationInvitation`** (`organization_invitations`): Stores SHA-256 `tokenHash`, target `email`, `roleId`, `status`, and `expiresAt`.
- **`Session`** (`sessions`) & **`RefreshTokenHistory`** (`refresh_token_history`): Stores hashed refresh tokens (`refreshTokenHash`), `familyId`, device/IP/user-agent metadata, activity/expiration timestamps, and previously rotated token hashes for family-wide reuse detection.
- **`EmailVerificationToken`** & **`PasswordResetToken`**: Single-use expiring SHA-256 token hashes (`consumedAt`).
- **`AuditLog`** (`audit_logs`): Actor, action, target type/ID, optional organization context, IP/user-agent, and redacted JSON metadata.

---

## 4. API Endpoints & Authorization Matrix

Interactive Swagger documentation is served at `/docs` (OpenAPI JSON at `/docs-json`).

### Health & CSRF
| Method & Path | Auth | Required Role / Permission | Description |
| --- | --- | --- | --- |
| `GET /health` | `@Public()` | None | App & PostgreSQL health check |
| `GET /auth/csrf` | `@Public()` | None | Issues `csrf_token` cookie for SPAs |

### Authentication (`/auth`)
| Method & Path | Auth | Notes |
| --- | --- | --- |
| `POST /auth/register` | `@Public()` | Rate-limited; assigns `DEFAULT_USER_ROLE`; queues verification email |
| `POST /auth/login` | `@Public()` | Rate-limited; Argon2id + timing equalization; sets HttpOnly cookies or returns tokens (`useCookies: false`) |
| `POST /auth/refresh` | `@Public()` | Validates CSRF when cookie-based; atomic refresh-token rotation + reuse detection |
| `POST /auth/logout` | JWT (`@RequireVerifiedEmail(false)`) | Revokes current session & clears auth cookies |
| `POST /auth/logout-all` | JWT (`@RequireVerifiedEmail(false)`) | Revokes all active sessions for current user |
| `POST /auth/verify-email` | `@Public()` | Consumes single-use SHA-256 hashed verification token |
| `POST /auth/resend-verification` | `@Public()` | Rate-limited; anti-enumeration generic response |
| `POST /auth/forgot-password` | `@Public()` | Rate-limited; anti-enumeration generic response |
| `POST /auth/reset-password` | `@Public()` | Validates single-use token, enforces password policy, revokes all active sessions |
| `GET /auth/google` | `@Public()` | Initiates Google OAuth 2.0 + PKCE (`S256`) + `state` + `nonce` + redirect allowlist |
| `GET /auth/google/callback` | `@Public()` | Verifies state cookie + PKCE + Google ID token; blocks silent hijack of existing accounts |
| `POST /auth/google` | `@Public()` | Verifies Google OIDC `idToken` server-side (mobile / Google One Tap) |
| `POST /auth/google/link/prepare` | JWT | Requires current password proof of ownership; issues short-lived `linkTicket` |
| `POST /auth/google/link` | JWT | Links verified Google ID token after password proof |
| `DELETE /auth/google/link` | JWT | Unlinks Google (blocked if user has no password set) |

### Users (`/users`)
| Method & Path | Auth | Required Permission | Description |
| --- | --- | --- | --- |
| `GET /users/me` | JWT (`@RequireVerifiedEmail(false)`) | Self | Current profile, roles, permissions, linked providers |
| `PATCH /users/me` | JWT | Self | Update `name` and `avatarUrl` |
| `PATCH /users/me/password` | JWT | Self | Verify current password, update password, revoke other sessions |
| `GET /users` | JWT | `user:read` | Paginated user listing |
| `GET /users/:id` | JWT | `user:read` | User details |
| `PATCH /users/:id/status` | JWT | `user:update` | Activate, deactivate, or suspend user (revokes sessions) |
| `DELETE /users/:id` | JWT | `user:delete` | Safe soft-delete + PII anonymization + session revocation |

### Sessions (`/sessions`)
| Method & Path | Auth | Policy | Description |
| --- | --- | --- | --- |
| `GET /sessions` | JWT | Self | List active sessions for current user |
| `DELETE /sessions/:id` | JWT | `SessionPolicy` (owner or `session:revoke`) | Revoke specific session |
| `DELETE /sessions` | JWT | Self | Revoke all other sessions |

### Roles & Permissions (`/roles`, `/permissions`)
| Method & Path | Auth | Required Permission | Description |
| --- | --- | --- | --- |
| `POST /permissions` | JWT | `permission:create` | Create `resource:action` permission |
| `GET /permissions` | JWT | `permission:read` | List permissions |
| `GET /permissions/:id` | JWT | `permission:read` | Get permission |
| `PATCH /permissions/:id` | JWT | `permission:update` | Update description/scope |
| `POST /roles` | JWT | `role:create` | Create dynamic global or org role |
| `GET /roles` | JWT | `role:read` | List roles with permissions |
| `GET /roles/:id` | JWT | `role:read` | Get role details |
| `PATCH /roles/:id` | JWT | `role:update` | Update role metadata |
| `DELETE /roles/:id` | JWT | `role:delete` | Delete custom role (system roles protected) |
| `POST /roles/:id/permissions` | JWT | `role:update` | Assign permissions (`add`/`replace`, escalation-protected) |
| `DELETE /roles/:id/permissions/:permissionId` | JWT | `role:update` | Remove permission from role |
| `POST /users/:id/roles` | JWT | `role:assign` | Assign `GLOBAL` role to user |
| `DELETE /users/:id/roles/:roleId` | JWT | `role:assign` | Remove `GLOBAL` role from user |
| `GET /users/:id/permissions` | JWT | `user:read` OR `role:read` | Query effective global or org permissions |

### Organizations (`/organizations`)
| Method & Path | Auth | Org Membership + Permission | Description |
| --- | --- | --- | --- |
| `POST /organizations` | JWT | `organization:create` | Create organization (creator becomes `org_owner`) |
| `GET /organizations` | JWT | Self | List organizations user belongs to |
| `POST /organizations/switch` | JWT | Verified membership | Switch `activeOrganizationId` |
| `POST /organizations/invitations/accept` | JWT | Verified email match | Accept single-use invitation |
| `POST /organizations/invitations/reject` | JWT | Verified email match | Reject pending invitation |
| `GET /organizations/:id` | JWT | `@UseOrganization()` + `organization:read` | Tenant-isolated org details |
| `PATCH /organizations/:id` | JWT | `@UseOrganization()` + `organization:update` | Update organization |
| `GET /organizations/:id/members` | JWT | `@UseOrganization()` + `organization_member:read` | List members |
| `POST /organizations/:id/invitations` | JWT | `@UseOrganization()` + `organization_member:invite` | Send invitation email |
| `GET /organizations/:id/invitations` | JWT | `@UseOrganization()` + `organization_member:invite` OR `organization_member:read` | List org invitations |
| `DELETE /organizations/:id/invitations/:invitationId` | JWT | `@UseOrganization()` + `organization_member:invite` | Revoke pending invitation |
| `PATCH /organizations/:id/members/:userId/roles` | JWT | `@UseOrganization()` + `organization_member:update` AND `role:assign` | Update member org roles |
| `DELETE /organizations/:id/members/:userId` | JWT | `@UseOrganization()` + `organization_member:remove` | Remove member (protects last `org_owner`) |

### Audit Logs (`/audit-logs`)
| Method & Path | Auth | Required Permission | Description |
| --- | --- | --- | --- |
| `GET /audit-logs` | JWT | `audit:read` | Paginated platform audit logs |
| `GET /organizations/:organizationId/audit-logs` | JWT | `@UseOrganization()` + `audit:read` | Tenant-scoped org audit logs |

---

## 5. Browser vs. Mobile Authentication & Security Model

- **Browser SPAs (Recommended)**: Set `useCookies: true` (default) on `/auth/login`. Access and refresh tokens are stored in `HttpOnly`, `SameSite=Lax` (or `Strict`), `Secure` (in production) cookies—**never in `localStorage`**, preventing XSS token exfiltration. First call `GET /auth/csrf` (or read the `csrf_token` cookie returned at login/refresh) and attach `X-CSRF-Token` on all state-changing cookie-authenticated requests (`POST`/`PATCH`/`PUT`/`DELETE`).
- **Mobile & Native Apps**: Pass `"useCookies": false` on `POST /auth/login`, `POST /auth/refresh`, and `POST /auth/google`. Store `accessToken` in memory and `refreshToken` in **iOS Keychain** or **Android EncryptedSharedPreferences / Keystore**. Send `Authorization: Bearer <accessToken>` on requests (CSRF double-submit checks are automatically bypassed when authenticating explicitly via `Authorization: Bearer`).

---

## 6. Local Setup (No Docker Required)

### Prerequisites
- Node.js 20+ (tested on Node 24) and npm
- Either a local PostgreSQL instance, **Prisma Local Postgres (`npx prisma dev`)**, or a **Supabase PostgreSQL** connection string.

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Copy environment template and configure values
cp .env.example .env

# 3. Optional: start local PostgreSQL without Docker using Prisma Dev
npm run db:start
# Or on first creation: npx prisma dev -d -n auth-dev -P 51214 -p 51213 --shadow-db-port 51215

# 4. Generate Prisma Client, apply migrations, and seed system roles/permissions
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed

# 5. Securely bootstrap your initial Super Admin (prompts interactively or reads BOOTSTRAP_ADMIN_* env vars)
npm run bootstrap:admin

# 6. Start development server
npm run start:dev
```

---

## 7. Google OAuth 2.0 Setup Guide

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select or create a project.
2. Navigate to **Google Auth Platform / OAuth consent screen**:
   - Choose **External** (or **Internal** for Google Workspace only).
   - Fill in App Name, User Support Email, and Developer Contact.
   - Add scopes: `openid`, `email`, `profile`.
   - Add test users if the app is in Testing mode.
3. Navigate to **Credentials -> Create Credentials -> OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: `http://localhost:3000`, `http://localhost:3001`, and your production Render/frontend domains.
   - **Authorized redirect URIs**:
     - Local: `http://localhost:3000/auth/google/callback`
     - Production: `https://<your-render-service>.onrender.com/auth/google/callback`
4. Copy the Client ID and Client Secret into `.env` / Render environment variables:
   ```env
   GOOGLE_OAUTH_ENABLED=true
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   ALLOWED_OAUTH_REDIRECT_URLS=http://localhost:3001/auth/callback
   ```

---

## 8. Supabase PostgreSQL Configuration

1. In Supabase Dashboard -> **Project Settings -> Database**:
   - **`DATABASE_URL`**: Use the **Transaction Pooler** (port `6543`, `?pgbouncer=true` optional with `@prisma/adapter-pg`, `sslmode=require`) for runtime application traffic.
   - **`DIRECT_URL`**: Use the **Direct connection** (port `5432`) or **Session Pooler** for Prisma migrations (`prisma7.config.ts` automatically selects `DIRECT_URL` over `DATABASE_URL`).
   - Set `DATABASE_SSL=true` and `DATABASE_SSL_REJECT_UNAUTHORIZED=true` in production.
2. **Lock down the Supabase Data API**:
   - Never expose authentication tables (`users`, `sessions`, `password_reset_tokens`, etc.) via PostgREST.
   - Run `prisma/supabase-hardening.sql` in the Supabase SQL Editor (enables RLS with zero permissive policies and revokes `anon`/`authenticated` privileges on `public` schema tables), or configure Supabase API settings to exclude the schema used by Prisma.

---

## 9. Render Deployment Guide

A `render.yaml` Blueprint is included at the repository root.

1. Push repository to GitHub and create a **Web Service** on Render (Node runtime).
2. Configure:
   - **Build Command**: `npm run render:build` (`npm ci && npx prisma generate && npm run build`)
   - **Start Command**: `npm run start:prod:migrate` (`npx prisma migrate deploy && node dist/main.js`)
   - **Health Check Path**: `/health`
3. Set all required secret environment variables in Render Dashboard (`DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `COOKIE_SECRET`, `APP_URL`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, `ALLOWED_OAUTH_REDIRECT_URLS`, SMTP, Google OAuth). Never run `prisma migrate reset` or destructive commands in production.
4. Run `npm run prisma:seed` and `npm run bootstrap:admin` once via Render Shell or one-off job.

### Render Free-Tier Considerations
- Free-tier Render web services sleep after ~15 minutes of inactivity.
- **Cold-start latency (30–60s)** affects the very first `/auth/google/callback` or `/auth/login` request after wake-up: configure frontend login flows with generous timeouts and clear loading states, and rely on Render's `/health` endpoint for readiness checks.
- For production SaaS workloads with active OAuth sign-in, upgrade to a paid always-on Render instance.

---

## 10. Reusing This Platform in Future NestJS Projects

1. **Import Core Modules**: Import `PrismaModule`, `CommonModule`, `AuthModule`, `UsersModule`, `RolesModule`, `PermissionsModule`, `OrganizationsModule`, `SessionsModule`, `AuditModule`, and `EmailModule` in your application's `AppModule` (or extract `src/` into a shared workspace package `@your-org/nestjs-auth`).
2. **Register Custom Feature Permissions**: Use `AuthModule.forFeaturePermissions({ customPermissions: [...] })` or inject `PermissionsService.registerModulePermissions([...])` inside `OnModuleInit`.
3. **Protect Feature Routes**:
   ```ts
   @Controller('organizations/:organizationId/projects')
   @UseOrganization({ paramName: 'organizationId' })
   export class ProjectsController {
     @Post()
     @RequirePermissions('project:create')
     create(
       @CurrentUser() user: AuthenticatedUser,
       @CurrentOrganization() org: OrganizationContext,
     ) {
       return this.projectsService.create(user, org);
     }
   }
   ```
4. **Implement Resource-Level Authorization**: See [src/examples/resource-authorization-example.ts](src/examples/resource-authorization-example.ts) for implementing `IAuthorizationPolicy` with `PolicyRegistryService` to enforce ownership + tenant boundaries cleanly inside services.

---

## 11. Testing

```bash
# Unit tests (Vitest)
npm test

# TypeScript strict check
npm run typecheck

# Type-aware linter (oxlint)
npm run lint

# Isolated PostgreSQL E2E tests (uses .env.test -> auth_test DB; auto-starts local Prisma Postgres if localhost:51214 is stopped)
npm run test:e2e
```
