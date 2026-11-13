import { Module } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller.js';
import { DeliveriesService } from './deliveries.service.js';
import { TrackingGateway } from './tracking.gateway.js';

@Module({
  controllers: [DeliveriesController],
  providers: [DeliveriesService, TrackingGateway],
  exports: [DeliveriesService, TrackingGateway],
})
export class DeliveriesModule {}

