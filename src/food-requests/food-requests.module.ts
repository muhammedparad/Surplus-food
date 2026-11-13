import { Module } from '@nestjs/common';
import { FoodRequestsController } from './food-requests.controller.js';
import { FoodRequestsService } from './food-requests.service.js';

@Module({
  controllers: [FoodRequestsController],
  providers: [FoodRequestsService],
  exports: [FoodRequestsService],
})
export class FoodRequestsModule {}
