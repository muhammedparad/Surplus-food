import {
  Body,
  Controller,
  Delete,
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
import { Public } from '../common/decorators/public.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { DonationsService } from './donations.service.js';
import { CreateDonationDto } from './dto/create-donation.dto.js';
import { QueryDonationsDto } from './dto/query-donations.dto.js';
import { UpdateDonationDto } from './dto/update-donation.dto.js';

@ApiTags('Food Donations')
@ApiBearerAuth()
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @RequirePermissions('donation:create')
  @ApiOperation({ summary: 'Publish a surplus food donation (Restaurants, Bakeries, Caterers)' })
  @ApiResponse({ status: 201, description: 'Donation published and available for NGO claims' })
  @ApiResponse({ status: 400, description: 'Safety declaration missing or invalid deadlines' })
  async createDonation(
    @Body() dto: CreateDonationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.donationsService.createDonation(dto, actor);
  }

  @Get()
  @RequirePermissions('donation:read')
  @ApiOperation({ summary: 'List and filter available food donations with remaining quantities' })
  @ApiResponse({ status: 200, description: 'Paginated list of available donations' })
  async listDonations(@Query() query: QueryDonationsDto) {
    return this.donationsService.listDonations(query);
  }

  @Get('allergens')
  @Public()
  @ApiOperation({ summary: 'List standard allergen categories for food labeling' })
  async listAllergens() {
    return this.donationsService.listAllergens();
  }

  @Get(':id')
  @RequirePermissions('donation:read')
  @ApiOperation({ summary: 'Get details of a specific donation, remaining quantity, and allergens' })
  @ApiParam({ name: 'id', description: 'Donation UUID' })
  @ApiResponse({ status: 200, description: 'Donation details' })
  @ApiResponse({ status: 404, description: 'Donation not found' })
  async getDonationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.donationsService.getDonationById(id);
  }

  @Patch(':id')
  @RequirePermissions('donation:update')
  @ApiOperation({ summary: 'Update food donation details' })
  @ApiParam({ name: 'id', description: 'Donation UUID' })
  async updateDonation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDonationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.donationsService.updateDonation(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('donation:delete')
  @ApiOperation({ summary: 'Cancel a food donation' })
  @ApiParam({ name: 'id', description: 'Donation UUID' })
  async cancelDonation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.donationsService.cancelDonation(id, actor);
  }
}
