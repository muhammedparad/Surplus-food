import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
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
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { ReviewTargetType } from '../generated/prisma/enums.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { QueryReviewsDto } from './dto/query-reviews.dto.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('Reviews & Feedback')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a rating and review for a restaurant, volunteer, or donation',
  })
  @ApiResponse({ status: 201, description: 'Review successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid rating or target entity' })
  @ApiResponse({ status: 403, description: 'User not eligible to review this delivery' })
  async createReview(
    @Body() dto: CreateReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviewsService.createReview(dto, actor);
  }

  @Get('target/:targetType/:targetId')
  @Public()
  @ApiOperation({
    summary: 'Get paginated reviews and aggregate ratings (average, total, breakdown) for an entity',
  })
  @ApiParam({
    name: 'targetType',
    enum: ReviewTargetType,
    description: 'ORGANIZATION, VOLUNTEER, or DONATION',
  })
  @ApiParam({ name: 'targetId', description: 'Target entity UUID' })
  @ApiResponse({ status: 200, description: 'Paginated reviews and aggregate metrics' })
  async getTargetReviews(
    @Param('targetType', new ParseEnumPipe(ReviewTargetType))
    targetType: ReviewTargetType,
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @Query() query: QueryReviewsDto,
  ) {
    return this.reviewsService.getTargetReviews(targetType, targetId, query);
  }
}
