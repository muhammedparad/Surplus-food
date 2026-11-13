import { Module } from '@nestjs/common';
import { EmailService, SmtpEmailDispatcher } from './email.service.js';
import { EMAIL_DISPATCHER } from './interfaces/email-job.interface.js';

@Module({
  providers: [
    SmtpEmailDispatcher,
    {
      provide: EMAIL_DISPATCHER,
      useExisting: SmtpEmailDispatcher,
    },
    EmailService,
  ],
  exports: [EmailService, EMAIL_DISPATCHER],
})
export class EmailModule {}
