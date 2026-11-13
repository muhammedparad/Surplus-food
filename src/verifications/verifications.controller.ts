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
import { QueryVerificationsDto } from './dto/query-verifications.dto.js';
import { ReviewVerificationDto } from './dto/review-verification.dto.js';
import { SubmitVerificationDto } from './dto/submit-verification.dto.js';
import { VerificationsService } from './verifications.service.js';

@ApiTags('Verifications')
@ApiBearerAuth()
@Controller('verifications')
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Post()
  @RequirePermissions('verification:submit')
  @ApiOperation({
    summary: 'Submit an organization (Restaurant/NGO) or volunteer profile for verification review',
  })
  @ApiResponse({ status: 201, description: 'Verification request created and pending review' })
  @ApiResponse({ status: 400, description: 'Invalid target or document specification' })
  @ApiResponse({ status: 409, description: 'Pending verification request already exists' })
  async submitVerification(
    @Body() dto: SubmitVerificationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.verificationsService.submitVerification(dto, actor);
  }

  @Get()
  @RequirePermissions('verification:read')
  @ApiOperation({ summary: 'List and filter pending or reviewed verification requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated verification requests' })
  async listVerifications(@Query() query: QueryVerificationsDto) {
    return this.verificationsService.listVerifications(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a verification request and its attached documents' })
  @ApiParam({ name: 'id', description: 'Verification request UUID' })
  @ApiResponse({ status: 200, description: 'Verification request details' })
  @ApiResponse({ status: 404, description: 'Verification request not found' })
  async getVerificationById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.verificationsService.getVerificationById(id, actor);
  }

  @Patch(':id/review')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('verification:review')
  @ApiOperation({
    summary: 'Approve or reject an organization or volunteer verification request (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Verification request UUID' })
  @ApiResponse({ status: 200, description: 'Verification decision recorded' })
  @ApiResponse({ status: 400, description: 'Invalid status or missing rejection reason' })
  @ApiResponse({ status: 409, description: 'Request is already finalized' })
  async reviewVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewVerificationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.verificationsService.reviewVerification(id, dto, actor);
  }
}
