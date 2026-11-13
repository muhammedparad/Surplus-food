import { Module } from '@nestjs/common';
import { DeliveriesModule } from '../deliveries/deliveries.module.js';
import { VolunteersController } from './volunteers.controller.js';
import { VolunteersService } from './volunteers.service.js';

@Module({
  imports: [DeliveriesModule],
  controllers: [VolunteersController],
  providers: [VolunteersService],
  exports: [VolunteersService],
})
export class VolunteersModule {}

