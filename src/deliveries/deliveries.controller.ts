import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Sse,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Observable } from 'rxjs';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { DeliveriesService } from './deliveries.service.js';
import {
  ScanDeliveryDto,
  ScanDirectHandoverDto,
  ScanPickupDto,
} from './dto/delivery-handshake.dto.js';
import { TrackingGateway } from './tracking.gateway.js';

@ApiTags('Deliveries & Volunteer Tracking')
@ApiBearerAuth()
@Controller('deliveries')
export class DeliveriesController {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  @Get('available')
  @RequirePermissions('delivery:accept')
  @ApiOperation({
    summary: 'List unassigned food delivery tasks available for verified volunteers (Blocked if volunteer has an active task)',
  })
  @ApiResponse({ status: 200, description: 'List of available delivery tasks' })
  @ApiResponse({ status: 409, description: 'Volunteer already has an active delivery in progress' })
  async listAvailableTasks(@CurrentUser() actor: AuthenticatedUser) {
    return this.deliveriesService.listAvailableTasks(actor);
  }

  @Post(':id/accept')
  @RequirePermissions('delivery:accept')
  @ApiOperation({
    summary: 'Accept a delivery task (Strictly enforces ONE active donation delivery at a time)',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Task claimed and locked to this volunteer' })
  @ApiResponse({ status: 409, description: 'Volunteer already has an active delivery in progress or task claimed' })
  async acceptDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.deliveriesService.acceptDelivery(id, actor);
  }

  @Post(':id/scan-pickup')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('delivery:update')
  @ApiOperation({
    summary: 'Volunteer confirms food pickup at restaurant by scanning optical QR token (or entering 6-digit code)',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Pickup verified. Status updated to IN_TRANSIT' })
  @ApiResponse({ status: 400, description: 'Invalid QR token or pickup code' })
  async confirmPickup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScanPickupDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.deliveriesService.confirmPickup(id, dto, actor);
  }

  @Get(':id/tracking')
  @RequirePermissions('delivery:read')
  @ApiOperation({
    summary: 'Live tracking feed for NGO and Volunteer showing real-time GPS position, ETA, and progress',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  async getLiveTracking(@Param('id', ParseUUIDPipe) id: string) {
    return this.deliveriesService.getLiveTracking(id);
  }

  @Sse(':id/tracking/stream')
  @RequirePermissions('delivery:read')
  @ApiOperation({
    summary: 'Server-Sent Events (SSE) live tracking stream for volunteer courier GPS position & ETA updates',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  streamTracking(
    @Param('id', ParseUUIDPipe) id: string,
  ): Observable<{ data: unknown }> {
    return this.trackingGateway.getLocationStream(id);
  }

  @Post(':id/scan-delivery')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('delivery:update')
  @ApiOperation({
    summary: 'Confirm final delivery at NGO drop-off by scanning NGO QR token (or entering 6-digit code). Releases volunteer task lock.',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Delivery complete. Claim marked COMPLETED and volunteer is freed.' })
  @ApiResponse({ status: 400, description: 'Invalid QR token or delivery code' })
  async confirmDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScanDeliveryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.deliveriesService.confirmDelivery(id, dto, actor);
  }

  @Post(':id/scan-direct-handover')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('claim:create')
  @ApiOperation({
    summary: 'Direct 1-step NGO pickup: NGO representative scans restaurant QR token or enters 6-digit code on-site',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Direct handover confirmed. Delivery status updated to DELIVERED.' })
  @ApiResponse({ status: 400, description: 'Verification failed or delivery not configured for direct NGO pickup' })
  async confirmDirectHandover(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScanDirectHandoverDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.deliveriesService.confirmDirectHandover(id, dto, actor);
  }
}
