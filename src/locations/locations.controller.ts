import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import {
  CreateDeliveryLocationDto,
  UpdateDeliveryLocationDto,
} from './dto/delivery-location.dto.js';
import {
  CreatePickupPointDto,
  UpdatePickupPointDto,
} from './dto/pickup-point.dto.js';
import { LocationsService } from './locations.service.js';

@ApiTags('Locations & Logistics')
@ApiBearerAuth()
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  // --- Pickup Points (Restaurants/Providers) ---

  @Post('pickup-points')
  @ApiOperation({ summary: 'Create a custom pickup spot for a restaurant or bakery' })
  @ApiResponse({ status: 201, description: 'Pickup point created' })
  async createPickupPoint(
    @Body() dto: CreatePickupPointDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.locationsService.createPickupPoint(dto, actor);
  }

  @Get('pickup-points/org/:organizationId')
  @ApiOperation({ summary: 'List active pickup spots for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  async listPickupPoints(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.locationsService.listPickupPoints(organizationId, actor);
  }

  @Get('pickup-points/:id')
  @ApiOperation({ summary: 'Get details of a specific pickup point' })
  @ApiParam({ name: 'id', description: 'Pickup point UUID' })
  async getPickupPoint(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.getPickupPoint(id);
  }

  @Patch('pickup-points/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a pickup point' })
  @ApiParam({ name: 'id', description: 'Pickup point UUID' })
  async updatePickupPoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePickupPointDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.locationsService.updatePickupPoint(id, dto, actor);
  }

  // --- Delivery Locations (NGOs) ---

  @Post('delivery-locations')
  @ApiOperation({ summary: 'Create a designated drop-off/receiving location for an NGO' })
  @ApiResponse({ status: 201, description: 'Delivery location created' })
  async createDeliveryLocation(
    @Body() dto: CreateDeliveryLocationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.locationsService.createDeliveryLocation(dto, actor);
  }

  @Get('delivery-locations/org/:organizationId')
  @ApiOperation({ summary: 'List active drop-off spots for an NGO organization' })
  @ApiParam({ name: 'organizationId', description: 'NGO Organization UUID' })
  async listDeliveryLocations(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.locationsService.listDeliveryLocations(organizationId, actor);
  }

  @Get('delivery-locations/:id')
  @ApiOperation({ summary: 'Get details of a specific NGO delivery location' })
  @ApiParam({ name: 'id', description: 'Delivery location UUID' })
  async getDeliveryLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.getDeliveryLocation(id);
  }

  @Patch('delivery-locations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an NGO delivery location' })
  @ApiParam({ name: 'id', description: 'Delivery location UUID' })
  async updateDeliveryLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryLocationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.locationsService.updateDeliveryLocation(id, dto, actor);
  }
}
