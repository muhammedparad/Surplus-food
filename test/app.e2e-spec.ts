import { config as loadDotenv } from 'dotenv';
loadDotenv({ path: '.env.test', override: true });

import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';
import { seedDatabase } from '../prisma/seed.js';
import { AppModule } from '../src/app.module.js';
import { GoogleOAuthService } from '../src/auth/google-oauth.service.js';
import {
  EMAIL_DISPATCHER,
  type EmailDispatcher,
  type EmailMessage,
} from '../src/email/interfaces/email-job.interface.js';
import { configureApp } from '../src/main.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

class CapturingEmailDispatcher implements EmailDispatcher {
  public readonly sent: EmailMessage[] = [];

  async dispatch(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }

  extractLatestToken(to: string, templateType: EmailMessage['templateType']): string {
    const matches = this.sent.filter(
      (m) => m.to === to && m.templateType === templateType,
    );
    const latest = matches[matches.length - 1];
    if (!latest) {
      throw new Error(`No email found for ${to} (${templateType})`);
    }
    const urlMatch = /token=([^\s"<]+)/.exec(latest.text);
    if (!urlMatch) {
      throw new Error(`No token found in email text: ${latest.text}`);
    }
    return decodeURIComponent(urlMatch[1]);
  }
}

async function waitForEmail(
  dispatcher: CapturingEmailDispatcher,
  to: string,
  templateType: EmailMessage['templateType'],
): Promise<string> {
  for (let i = 0; i < 40; i++) {
    try {
      return dispatcher.extractLatestToken(to, templateType);
    } catch {
      await new Promise((r) => setTimeout(r, 25));
    }
  }
  return dispatcher.extractLatestToken(to, templateType);
}

function extractCookieValue(setCookieHeaders: string[] | string | undefined, name: string): string | undefined {
  const list = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : setCookieHeaders
      ? [setCookieHeaders]
      : [];
  for (const header of list) {
    const prefix = `${name}=`;
    if (header.startsWith(prefix)) {
      return header.slice(prefix.length).split(';')[0];
    }
  }
  return undefined;
}

describe('Authentication & Authorization Platform (PostgreSQL E2E)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let emailDispatcher: CapturingEmailDispatcher;
  let googleOAuthService: GoogleOAuthService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    emailDispatcher = new CapturingEmailDispatcher();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMAIL_DISPATCHER)
      .useValue(emailDispatcher)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    googleOAuthService = app.get(GoogleOAuthService);

    const healthy = await prisma.checkHealth();
    if (!healthy) {
      throw new Error(
        'PostgreSQL test database is unreachable. Start local DB ("npm run db:start" or "npx prisma dev -d -n auth-dev") or verify DATABASE_URL in .env.test.',
      );
    }

    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        audit_logs,
        password_reset_tokens,
        email_verification_tokens,
        refresh_token_history,
        sessions,
        organization_invitations,
        organization_member_roles,
        organization_members,
        organizations,
        user_roles,
        role_permissions,
        permissions,
        roles,
        auth_provider_accounts,
        users
      RESTART IDENTITY CASCADE
    `);

    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health reports database connectivity and Swagger OpenAPI document builds cleanly', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');

    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Test').setVersion('1.0').build(),
    );
    expect(doc.paths['/auth/login']).toBeDefined();
    expect(doc.paths['/organizations/{id}/members']).toBeDefined();
  });

  it('completes registration, duplicate rejection, email verification, login, and password reset', async () => {
    const email = 'alice.e2e@example.com';

    // Weak / mismatched password & mass assignment rejected
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Alice',
        email,
        password: 'weak',
        confirmPassword: 'weak',
        role: 'super_admin',
      })
      .expect(400);

    // Valid registration
    const regRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Alice E2E',
        email,
        password: 'Str0ng!Password1',
        confirmPassword: 'Str0ng!Password1',
      })
      .expect(201);

    expect(regRes.body.user.email).toBe(email);
    expect(regRes.body.user.passwordHash).toBeUndefined();

    // Duplicate registration blocked
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Alice E2E',
        email,
        password: 'Str0ng!Password1',
        confirmPassword: 'Str0ng!Password1',
      })
      .expect(409);

    // Login before verification blocked
    const unverifiedLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Str0ng!Password1' })
      .expect(403);
    expect(unverifiedLogin.body.code).toBe('EMAIL_NOT_VERIFIED');

    // Verify email using single-use token from email
    const verifyToken = await waitForEmail(emailDispatcher, email, 'email_verification');
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: verifyToken })
      .expect(200);

    // Reuse of verification token blocked
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: verifyToken })
      .expect(400);

    // Wrong password and unknown email produce identical 401
    const wrongPass = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPassword!1' })
      .expect(401);
    const unknownEmail = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'missing@example.com', password: 'WrongPassword!1' })
      .expect(401);
    expect(wrongPass.body.message).toBe(unknownEmail.body.message);

    // Successful login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Str0ng!Password1', useCookies: false })
      .expect(200);

    expect(loginRes.body.accessToken).toBeTruthy();
    expect(loginRes.body.refreshToken).toBeTruthy();

    // Protected route works with Bearer token and fails without auth
    await request(app.getHttpServer()).get('/users/me').expect(401);
    const meRes = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);
    expect(meRes.body.email).toBe(email);
    expect(meRes.body.passwordHash).toBeUndefined();

    // Forgot password anti-enumeration for unknown email
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'doesnotexist@example.com' })
      .expect(200);

    // Reset password invalidates existing sessions
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(200);
    const resetToken = await waitForEmail(emailDispatcher, email, 'password_reset');

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'Updated!Password2',
        confirmPassword: 'Updated!Password2',
      })
      .expect(200);

    // Old access token & refresh token are both rejected after password reset
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: loginRes.body.refreshToken, useCookies: false })
      .expect(401);

    // Login with new password succeeds
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Updated!Password2', useCookies: false })
      .expect(200);
  });

  it('rotates refresh tokens, detects token reuse, enforces CSRF on cookie mutations, and revokes sessions', async () => {
    const email = 'bob.e2e@example.com';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Bob E2E',
        email,
        password: 'Str0ng!Password1',
        confirmPassword: 'Str0ng!Password1',
      })
      .expect(201);
    const verifyToken = await waitForEmail(emailDispatcher, email, 'email_verification');
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: verifyToken })
      .expect(200);

    // Mobile/API token flow: rotate T1 -> T2, then replay T1 -> family revoked!
    const loginTokenMode = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Str0ng!Password1', useCookies: false })
      .expect(200);
    const t1 = loginTokenMode.body.refreshToken as string;

    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: t1, useCookies: false })
      .expect(200);
    const t2 = refreshRes.body.refreshToken as string;
    const accessAfterRefresh = refreshRes.body.accessToken as string;
    expect(t2).not.toBe(t1);

    // Replay T1 -> triggers reuse detection & revokes entire family
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: t1, useCookies: false })
      .expect(401);

    // T2 and the access token in the compromised family are now revoked!
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: t2, useCookies: false })
      .expect(401);
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessAfterRefresh}`)
      .expect(401);

    // Cookie + CSRF flow
    const cookieLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Str0ng!Password1', useCookies: true })
      .expect(200);
    const cookies = cookieLogin.headers['set-cookie'];
    const accessCookie = extractCookieValue(cookies, 'access_token');
    const csrfCookie = extractCookieValue(cookies, 'csrf_token');
    expect(accessCookie).toBeTruthy();
    expect(csrfCookie).toBeTruthy();

    // Mutation with cookie auth WITHOUT CSRF header is rejected
    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Cookie', [`access_token=${accessCookie}`, `csrf_token=${csrfCookie}`])
      .send({ name: 'Bob Tampered' })
      .expect(403);

    // Mutation WITH matching CSRF header succeeds
    const updatedProfile = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Cookie', [`access_token=${accessCookie}`, `csrf_token=${csrfCookie}`])
      .set('X-CSRF-Token', csrfCookie!)
      .send({ name: 'Bob Verified' })
      .expect(200);
    expect(updatedProfile.body.name).toBe('Bob Verified');

    // Logout revokes session
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', [`access_token=${accessCookie}`, `csrf_token=${csrfCookie}`])
      .set('X-CSRF-Token', csrfCookie!)
      .expect(200);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', [`access_token=${accessCookie}`])
      .expect(401);
  });

  it('validates Google OAuth state/PKCE, registers new Google users, blocks silent auto-merge, and supports explicit linking', async () => {
    // 1. Initiate Google OAuth redirect -> returns PKCE + state + oauth_tx cookie
    const initRes = await request(app.getHttpServer())
      .get('/auth/google')
      .query({ redirectUrl: 'http://localhost:3001/auth/callback' })
      .expect(302);

    const location = initRes.headers.location as string;
    expect(location).toContain('accounts.google.com');
    expect(location).toContain('code_challenge_method=S256');
    const oauthTxCookie = extractCookieValue(initRes.headers['set-cookie'], 'oauth_tx');
    expect(oauthTxCookie).toBeTruthy();

    // 2. Callback with mismatched state fails
    await request(app.getHttpServer())
      .get('/auth/google/callback')
      .set('Cookie', [`oauth_tx=${oauthTxCookie}`])
      .query({ code: 'fake-code', state: 'invalid-state' })
      .expect(401);

    // 3. Mock Google token exchange/verification ONLY at Google HTTP boundary
    const stateParam = new URL(location).searchParams.get('state')!;
    const exchangeSpy = vi
      .spyOn(googleOAuthService, 'exchangeAuthorizationCode')
      .mockResolvedValueOnce({
        sub: 'google-sub-new-user',
        email: 'google.new@example.com',
        emailVerified: true,
        name: 'Google New User',
        picture: 'https://lh3.googleusercontent.com/photo.png',
      });

    const cbRes = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .set('Cookie', [`oauth_tx=${oauthTxCookie}`])
      .query({ code: 'valid-code', state: stateParam })
      .expect(302);
    expect(cbRes.headers.location).toBe('http://localhost:3001/auth/callback');
    expect(extractCookieValue(cbRes.headers['set-cookie'], 'access_token')).toBeTruthy();
    exchangeSpy.mockRestore();

    // 4. Attempting Google login for Alice's existing password email blocks silent hijack
    const verifySpy = vi
      .spyOn(googleOAuthService, 'verifyGoogleIdToken')
      .mockResolvedValueOnce({
        sub: 'google-sub-hijack-attempt',
        email: 'alice.e2e@example.com',
        emailVerified: true,
        name: 'Alice',
        picture: null,
      });

    const conflictRes = await request(app.getHttpServer())
      .post('/auth/google')
      .send({ idToken: 'fake.google.id.token.string.12345' })
      .expect(409);
    expect(conflictRes.body.code).toBe('ACCOUNT_LINK_REQUIRED');
    verifySpy.mockRestore();

    // 5. Authenticated explicit linking with currentPassword succeeds
    const aliceLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alice.e2e@example.com',
        password: 'Updated!Password2',
        useCookies: false,
      })
      .expect(200);

    const verifyLinkSpy = vi
      .spyOn(googleOAuthService, 'verifyGoogleIdToken')
      .mockResolvedValueOnce({
        sub: 'google-sub-alice-verified',
        email: 'alice.e2e@example.com',
        emailVerified: true,
        name: 'Alice',
        picture: null,
      });

    await request(app.getHttpServer())
      .post('/auth/google/link')
      .set('Authorization', `Bearer ${aliceLogin.body.accessToken}`)
      .send({
        idToken: 'fake.google.id.token.string.12345',
        currentPassword: 'Updated!Password2',
      })
      .expect(200);
    verifyLinkSpy.mockRestore();

    // Unlink works because Alice has a password set
    await request(app.getHttpServer())
      .delete('/auth/google/link')
      .set('Authorization', `Bearer ${aliceLogin.body.accessToken}`)
      .expect(200);
  });

  it('enforces dynamic RBAC, multi-tenant organization isolation, invitations, and audit logging', async () => {
    // Login as Alice and Bob
    const aliceLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alice.e2e@example.com',
        password: 'Updated!Password2',
        useCookies: false,
      })
      .expect(200);
    const aliceToken = aliceLogin.body.accessToken as string;
    const aliceId = aliceLogin.body.user.id as string;

    const bobLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'bob.e2e@example.com',
        password: 'Str0ng!Password1',
        useCookies: false,
      })
      .expect(200);
    const bobToken = bobLogin.body.accessToken as string;
    const bobId = bobLogin.body.user.id as string;

    // Non-admin Alice is denied admin endpoints
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(403);

    // Promote Alice to super_admin in DB (simulating bootstrap:admin)
    const superAdminRole = await prisma.role.findFirstOrThrow({
      where: { slug: 'super_admin', organizationId: null },
    });
    await prisma.userRole.create({
      data: { userId: aliceId, roleId: superAdminRole.id },
    });

    // Alice can now dynamically create permission, create custom role, assign permission, and assign role to Bob
    const permRes = await request(app.getHttpServer())
      .post('/permissions')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ key: 'report:export', description: 'Export analytical reports' })
      .expect(201);

    const roleRes = await request(app.getHttpServer())
      .post('/roles')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Analyst', slug: 'analyst', scope: 'GLOBAL' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/roles/${roleRes.body.id}/permissions`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ permissionIds: [permRes.body.id], mode: 'add' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/users/${bobId}/roles`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ roleId: roleRes.body.id })
      .expect(200);

    const bobPerms = await request(app.getHttpServer())
      .get(`/users/${bobId}/permissions`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);
    expect(bobPerms.body.permissions).toContain('report:export');

    // System role deletion is blocked
    await request(app.getHttpServer())
      .delete(`/roles/${superAdminRole.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(403);

    // Multi-tenant organizations: Alice creates Org X, Bob creates Org Y
    const orgXRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Org X', slug: 'org-x' })
      .expect(201);
    const orgXId = orgXRes.body.id as string;

    const orgYRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ name: 'Org Y', slug: 'org-y' })
      .expect(201);
    const orgYId = orgYRes.body.id as string;

    // Cross-tenant isolation: Even global super_admin Alice is blocked from Org Y where Alice is NOT a member!
    await request(app.getHttpServer())
      .get(`/organizations/${orgYId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(403);

    // Alice invites Bob to Org X as org_viewer
    await request(app.getHttpServer())
      .post(`/organizations/${orgXId}/invitations`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ email: 'bob.e2e@example.com', roleSlug: 'org_viewer' })
      .expect(201);

    const inviteToken = await waitForEmail(
      emailDispatcher,
      'bob.e2e@example.com',
      'organization_invitation',
    );

    // Bob accepts invitation
    await request(app.getHttpServer())
      .post('/organizations/invitations/accept')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ token: inviteToken })
      .expect(200);

    // Bob can read Org X (org_viewer has organization:read) and switch active organization
    await request(app.getHttpServer())
      .get(`/organizations/${orgXId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);

    const switchRes = await request(app.getHttpServer())
      .post('/organizations/switch')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ organizationId: orgXId })
      .expect(200);
    expect(switchRes.body.activeOrganizationId).toBe(orgXId);

    // Bob is org_viewer in Org X (cannot update Org X or read members)
    await request(app.getHttpServer())
      .patch(`/organizations/${orgXId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ name: 'Hijacked Org X' })
      .expect(403);

    // Yet Bob IS org_owner in Org Y (CAN update Org Y!)
    const updateOrgY = await request(app.getHttpServer())
      .patch(`/organizations/${orgYId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ name: 'Org Y Updated' })
      .expect(200);
    expect(updateOrgY.body.name).toBe('Org Y Updated');

    // Audit logs recorded security events safely without leaking tokens/passwords
    const auditRes = await request(app.getHttpServer())
      .get('/audit-logs')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);
    expect(auditRes.body.items.length).toBeGreaterThan(5);
    const serialized = JSON.stringify(auditRes.body);
    expect(serialized).not.toContain('Updated!Password2');
    expect(serialized).not.toContain('Str0ng!Password1');

    // Session listing + cross-user session revocation denial + admin suspension
    const aliceSessions = await request(app.getHttpServer())
      .get('/sessions')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);
    expect(aliceSessions.body.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(aliceSessions.body)).not.toContain('refreshTokenHash');

    await request(app.getHttpServer())
      .delete(`/sessions/${aliceSessions.body[0].id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(403);

    // Suspending Bob immediately revokes Bob's active sessions & blocks login
    await request(app.getHttpServer())
      .patch(`/users/${bobId}/status`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ status: 'SUSPENDED', reason: 'Security review' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bob.e2e@example.com', password: 'Str0ng!Password1', useCookies: false })
      .expect(403);
  });
});
