export type EmailTemplateType =
  | 'welcome'
  | 'email_verification'
  | 'password_reset'
  | 'organization_invitation'
  | 'login_notification';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  templateType: EmailTemplateType;
}

export interface EmailDispatcher {
  dispatch(message: EmailMessage): Promise<void>;
}

export const EMAIL_DISPATCHER = Symbol('EMAIL_DISPATCHER');
