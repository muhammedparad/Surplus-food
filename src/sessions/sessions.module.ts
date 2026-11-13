import { Module } from '@nestjs/common';
import { SessionPolicy } from './session.policy.js';
import { SessionsController } from './sessions.controller.js';
import { SessionsService } from './sessions.service.js';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, SessionPolicy],
  exports: [SessionsService],
})
export class SessionsModule {}
