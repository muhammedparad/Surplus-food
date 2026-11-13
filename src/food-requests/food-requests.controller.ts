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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import {
  CreateFoodRequestDto,
  ProposeFulfillmentDto,
} from './dto/food-request.dto.js';
import { QueryFoodRequestsDto } from './dto/query-food-requests.dto.js';
import { FoodRequestsService } from './food-requests.service.js';

@ApiTags('NGO Advance Food Requests')
@ApiBearerAuth()
@Controller('food-requests')
export class FoodRequestsController {
  constructor(private readonly foodRequestsService: FoodRequestsService) {}

  @Post()
  @RequirePermissions('food_request:create')
  @ApiOperation({
    summary: 'Post an advance food requirement for an upcoming date (Verified NGOs only)',
  })
  @ApiResponse({ status: 201, description: 'Food requirement posted and open for matching' })
  @ApiResponse({ status: 403, description: 'NGO is unverified' })
  async createRequest(
    @Body() dto: CreateFoodRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.foodRequestsService.createRequest(dto, actor);
  }

  @Get()
  @RequirePermissions('food_request:read')
  @ApiOperation({ summary: 'List and filter open advance food requirements from NGOs' })
  @ApiResponse({ status: 200, description: 'Paginated list of food requirements' })
  async listRequests(@Query() query: QueryFoodRequestsDto) {
    return this.foodRequestsService.listRequests(query);
  }

  @Get(':id')
  @RequirePermissions('food_request:read')
  @ApiOperation({ summary: 'Get details of a specific advance requirement and fulfillment proposals' })
  @ApiParam({ name: 'id', description: 'Food request UUID' })
  async getRequestById(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodRequestsService.getRequestById(id);
  }

  @Post(':id/fulfillments')
  @RequirePermissions('food_request:update')
  @ApiOperation({
    summary: 'A restaurant proposes food allocation from an available donation to fulfill this NGO requirement',
  })
  @ApiParam({ name: 'id', description: 'Food request UUID' })
  @ApiResponse({ status: 201, description: 'Fulfillment proposal created' })
  @ApiResponse({ status: 409, description: 'Proposed quantity exceeds remaining food in donation' })
  async proposeFulfillment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProposeFulfillmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.foodRequestsService.proposeFulfillment(id, dto, actor);
  }

  @Patch('fulfillments/:fulfillmentId/accept')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('food_request:update')
  @ApiOperation({
    summary: 'NGO accepts proposed fulfillment, locks donation allocation, and triggers delivery workflow',
  })
  @ApiParam({ name: 'fulfillmentId', description: 'Fulfillment UUID' })
  @ApiResponse({ status: 200, description: 'Fulfillment accepted, claim & delivery spawned' })
  async acceptFulfillment(
    @Param('fulfillmentId', ParseUUIDPipe) fulfillmentId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.foodRequestsService.acceptFulfillment(fulfillmentId, actor);
  }

  @Patch('fulfillments/:fulfillmentId/reject')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('food_request:update')
  @ApiOperation({ summary: 'NGO rejects a proposed food fulfillment' })
  @ApiParam({ name: 'fulfillmentId', description: 'Fulfillment UUID' })
  async rejectFulfillment(
    @Param('fulfillmentId', ParseUUIDPipe) fulfillmentId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.foodRequestsService.rejectFulfillment(fulfillmentId, actor);
  }
}
