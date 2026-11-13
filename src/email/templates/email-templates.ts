function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export interface RenderedTemplate {
  subject: string;
  html: string;
  text: string;
}

export function renderWelcomeEmail(params: {
  appName: string;
  name: string;
  loginUrl: string;
}): RenderedTemplate {
  const app = escapeHtml(params.appName);
  const name = escapeHtml(params.name);
  const url = escapeHtml(params.loginUrl);

  return {
    subject: `Welcome to ${params.appName}`,
    html: `<p>Hi ${name},</p><p>Welcome to <strong>${app}</strong>. Your account has been created.</p><p><a href="${url}">Sign in to your account</a></p>`,
    text: `Hi ${params.name},\n\nWelcome to ${params.appName}. Your account has been created.\nSign in: ${params.loginUrl}`,
  };
}

export function renderEmailVerificationEmail(params: {
  appName: string;
  name: string;
  verificationUrl: string;
  expiresIn: string;
}): RenderedTemplate {
  const app = escapeHtml(params.appName);
  const name = escapeHtml(params.name);
  const url = escapeHtml(params.verificationUrl);
  const exp = escapeHtml(params.expiresIn);

  return {
    subject: `Verify your email for ${params.appName}`,
    html: `<p>Hi ${name},</p><p>Please verify your email address for <strong>${app}</strong> by clicking the link below:</p><p><a href="${url}">Verify Email Address</a></p><p>This link expires in ${exp}. If you did not create this account, you can safely ignore this message.</p>`,
    text: `Hi ${params.name},\n\nVerify your email for ${params.appName}: ${params.verificationUrl}\n\nThis link expires in ${params.expiresIn}.`,
  };
}

export function renderPasswordResetEmail(params: {
  appName: string;
  name: string;
  resetUrl: string;
  expiresIn: string;
}): RenderedTemplate {
  const app = escapeHtml(params.appName);
  const name = escapeHtml(params.name);
  const url = escapeHtml(params.resetUrl);
  const exp = escapeHtml(params.expiresIn);

  return {
    subject: `Reset your ${params.appName} password`,
    html: `<p>Hi ${name},</p><p>We received a request to reset your password on <strong>${app}</strong>.</p><p><a href="${url}">Reset Password</a></p><p>This single-use link expires in ${exp}. If you did not request a password reset, please ignore this email.</p>`,
    text: `Hi ${params.name},\n\nReset your ${params.appName} password: ${params.resetUrl}\n\nThis single-use link expires in ${params.expiresIn}.`,
  };
}

export function renderOrganizationInvitationEmail(params: {
  appName: string;
  organizationName: string;
  inviterName: string;
  roleName: string;
  acceptUrl: string;
  expiresIn: string;
}): RenderedTemplate {
  const app = escapeHtml(params.appName);
  const org = escapeHtml(params.organizationName);
  const inviter = escapeHtml(params.inviterName);
  const role = escapeHtml(params.roleName);
  const url = escapeHtml(params.acceptUrl);
  const exp = escapeHtml(params.expiresIn);

  return {
    subject: `You are invited to join ${params.organizationName} on ${params.appName}`,
    html: `<p>${inviter} invited you to join <strong>${org}</strong> as <strong>${role}</strong> on ${app}.</p><p><a href="${url}">Review Invitation</a></p><p>This invitation expires in ${exp}.</p>`,
    text: `${params.inviterName} invited you to join ${params.organizationName} as ${params.roleName} on ${params.appName}.\n\nReview invitation: ${params.acceptUrl}\nExpires in ${params.expiresIn}.`,
  };
}

export function renderLoginNotificationEmail(params: {
  appName: string;
  name: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}): RenderedTemplate {
  const app = escapeHtml(params.appName);
  const name = escapeHtml(params.name);
  const ip = escapeHtml(params.ipAddress);
  const ua = escapeHtml(params.userAgent);
  const ts = escapeHtml(params.timestamp);

  return {
    subject: `New sign-in to your ${params.appName} account`,
    html: `<p>Hi ${name},</p><p>A new sign-in to your <strong>${app}</strong> account was detected.</p><ul><li>Time: ${ts}</li><li>IP Address: ${ip}</li><li>Device: ${ua}</li></ul><p>If this was not you, revoke your active sessions and reset your password immediately.</p>`,
    text: `Hi ${params.name},\n\nA new sign-in to ${params.appName} occurred at ${params.timestamp} from IP ${params.ipAddress} (${params.userAgent}).\nIf this wasn't you, revoke sessions and reset your password.`,
  };
}
