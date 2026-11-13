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
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { ClaimsService } from './claims.service.js';
import {
  ApproveClaimDto,
  CreateClaimDto,
  RejectClaimDto,
} from './dto/claim.dto.js';

@ApiTags('NGO Donation Claims')
@ApiBearerAuth()
@Controller()
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post('donations/:donationId/claims')
  @RequirePermissions('claim:create')
  @ApiOperation({ summary: 'Submit a portion claim for an available food donation (Verified NGOs only)' })
  @ApiParam({ name: 'donationId', description: 'Donation UUID' })
  @ApiResponse({ status: 201, description: 'Claim submitted and pending restaurant review' })
  @ApiResponse({ status: 400, description: 'Over-allocation or donation expired' })
  @ApiResponse({ status: 403, description: 'NGO is unverified' })
  @ApiResponse({ status: 409, description: 'Claim already exists for this NGO' })
  async submitClaim(
    @Param('donationId', ParseUUIDPipe) donationId: string,
    @Body() dto: CreateClaimDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.claimsService.submitClaim(donationId, dto, actor);
  }

  @Get('donations/:donationId/claims')
  @RequirePermissions('claim:read')
  @ApiOperation({ summary: 'List all NGO claims submitted for a specific donation (Restaurant view)' })
  @ApiParam({ name: 'donationId', description: 'Donation UUID' })
  async listClaimsForDonation(
    @Param('donationId', ParseUUIDPipe) donationId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.claimsService.listClaimsForDonation(donationId, actor);
  }

  @Get('claims/ngo/:ngoId')
  @RequirePermissions('claim:read')
  @ApiOperation({ summary: 'List all donation claims submitted by an NGO organization' })
  @ApiParam({ name: 'ngoId', description: 'NGO Organization UUID' })
  async listClaimsByNgo(
    @Param('ngoId', ParseUUIDPipe) ngoId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.claimsService.listClaimsByNgo(ngoId, actor);
  }

  @Get('claims/:id')
  @RequirePermissions('claim:read')
  @ApiOperation({ summary: 'Get details of a specific claim and its delivery workflow' })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
  async getClaimById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.claimsService.getClaimById(id, actor);
  }

  @Patch('claims/:id/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('claim:review')
  @ApiOperation({
    summary: 'Approve an NGO claim, lock quantity allocation, and automatically spawn delivery workflow',
  })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
  @ApiResponse({ status: 200, description: 'Claim approved, quantity locked, delivery task initialized' })
  @ApiResponse({ status: 409, description: 'Approved quantity exceeds remaining surplus food' })
  async approveClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveClaimDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.claimsService.approveClaim(id, dto, actor);
  }

  @Patch('claims/:id/reject')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('claim:review')
  @ApiOperation({ summary: 'Reject a pending NGO food claim' })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
  async rejectClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectClaimDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.claimsService.rejectClaim(id, dto, actor);
  }
}
