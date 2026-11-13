import { registerAs } from '@nestjs/config';

export interface MailConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}

export const mailConfig = registerAs('mail', (): MailConfig => ({
  enabled: process.env.SMTP_ENABLED === 'true',
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || undefined,
  password: process.env.SMTP_PASSWORD || undefined,
  from: process.env.EMAIL_FROM ?? 'Auth Platform <no-reply@example.com>',
}));
