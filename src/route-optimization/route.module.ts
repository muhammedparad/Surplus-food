import { Module } from '@nestjs/common';
import { RouteOptimizationService } from './route.service.js';

@Module({
  providers: [RouteOptimizationService],
  exports: [RouteOptimizationService],
})
export class RouteOptimizationModule {}
