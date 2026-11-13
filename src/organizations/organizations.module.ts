import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module.js';
import { OrganizationResourcePolicy } from './organization.policy.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  imports: [EmailModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationResourcePolicy],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
