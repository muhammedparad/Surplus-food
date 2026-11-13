import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { MailConfig } from '../config/mail.config.js';
import {
  EMAIL_DISPATCHER,
  type EmailDispatcher,
  type EmailMessage,
} from './interfaces/email-job.interface.js';
import {
  renderEmailVerificationEmail,
  renderLoginNotificationEmail,
  renderOrganizationInvitationEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
} from './templates/email-templates.js';

@Injectable()
export class SmtpEmailDispatcher implements EmailDispatcher {
  private readonly logger = new Logger(SmtpEmailDispatcher.name);
  private readonly transporter: Transporter | null;
  private readonly mailConfig: MailConfig;

  constructor(private readonly configService: ConfigService) {
    this.mailConfig = this.configService.get<MailConfig>('mail') ?? {
      enabled: false,
      host: 'localhost',
      port: 1025,
      secure: false,
      from: 'Auth Platform <no-reply@example.com>',
    };

    if (this.mailConfig.enabled) {
      this.transporter = nodemailer.createTransport({
        host: this.mailConfig.host,
        port: this.mailConfig.port,
        secure: this.mailConfig.secure,
        auth:
          this.mailConfig.user && this.mailConfig.password
            ? { user: this.mailConfig.user, pass: this.mailConfig.password }
            : undefined,
      });
    } else {
      this.transporter = null;
    }
  }

  async dispatch(message: EmailMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[SMTP disabled] Queued "${message.templateType}" email (recipient redacted in logs)`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.mailConfig.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly appName: string;
  private readonly frontendUrl: string;

  constructor(
    @Inject(EMAIL_DISPATCHER) private readonly dispatcher: EmailDispatcher,
    private readonly configService: ConfigService,
  ) {
    this.appName = this.configService.get<string>('app.appName') ?? 'AuthPlatform';
    this.frontendUrl =
      this.configService.get<string>('app.frontendUrl') ?? 'http://localhost:3001';
  }

  /**
   * Dispatches email asynchronously so critical auth transactions are never blocked
   * or rolled back by transient SMTP errors. Ready to back with a persistent queue.
   */
  private enqueueNonBlocking(message: EmailMessage): void {
    setImmediate(() => {
      void this.dispatcher.dispatch(message).catch((err: unknown) => {
        this.logger.error(
          `Email delivery failed for template "${message.templateType}": ${
            err instanceof Error ? err.message : 'Unknown SMTP error'
          }`,
        );
      });
    });
  }

  sendWelcomeEmail(to: string, name: string): void {
    const rendered = renderWelcomeEmail({
      appName: this.appName,
      name,
      loginUrl: `${this.frontendUrl}/login`,
    });
    this.enqueueNonBlocking({
      to,
      ...rendered,
      templateType: 'welcome',
    });
  }

  sendVerificationEmail(to: string, name: string, rawToken: string, expiresIn: string): void {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
    const rendered = renderEmailVerificationEmail({
      appName: this.appName,
      name,
      verificationUrl,
      expiresIn,
    });
    this.enqueueNonBlocking({
      to,
      ...rendered,
      templateType: 'email_verification',
    });
  }

  sendPasswordResetEmail(to: string, name: string, rawToken: string, expiresIn: string): void {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const rendered = renderPasswordResetEmail({
      appName: this.appName,
      name,
      resetUrl,
      expiresIn,
    });
    this.enqueueNonBlocking({
      to,
      ...rendered,
      templateType: 'password_reset',
    });
  }

  sendOrganizationInvitationEmail(params: {
    to: string;
    organizationName: string;
    inviterName: string;
    roleName: string;
    rawToken: string;
    expiresIn: string;
  }): void {
    const acceptUrl = `${this.frontendUrl}/invitations/accept?token=${encodeURIComponent(params.rawToken)}`;
    const rendered = renderOrganizationInvitationEmail({
      appName: this.appName,
      organizationName: params.organizationName,
      inviterName: params.inviterName,
      roleName: params.roleName,
      acceptUrl,
      expiresIn: params.expiresIn,
    });
    this.enqueueNonBlocking({
      to: params.to,
      ...rendered,
      templateType: 'organization_invitation',
    });
  }

  sendLoginNotificationEmail(params: {
    to: string;
    name: string;
    ipAddress: string;
    userAgent: string;
  }): void {
    const rendered = renderLoginNotificationEmail({
      appName: this.appName,
      name: params.name,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date().toISOString(),
    });
    this.enqueueNonBlocking({
      to: params.to,
      ...rendered,
      templateType: 'login_notification',
    });
  }
}
