import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ReviewTargetType } from '../../generated/prisma/enums.js';

export class CreateReviewDto {
  @ApiProperty({
    enum: ReviewTargetType,
    example: ReviewTargetType.ORGANIZATION,
    description: 'Target of the review: ORGANIZATION (restaurant/caterer/NGO), VOLUNTEER, or DONATION',
  })
  @IsEnum(ReviewTargetType)
  targetType!: ReviewTargetType;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the target organization, volunteer profile, or donation',
  })
  @IsUUID('4')
  targetId!: string;

  @ApiPropertyOptional({
    example: 'd9b2b63d-a4c3-4d2d-8fa0-6f920da68181',
    description: 'Optional delivery UUID that this review is associated with',
  })
  @IsOptional()
  @IsUUID('4')
  deliveryId?: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Star rating from 1 (poor) to 5 (excellent)',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating!: number;

  @ApiPropertyOptional({
    example: 'Food was packaged in pristine thermal containers and picked up right on schedule.',
    description: 'Optional review comments / feedback',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({
    example: { foodHygiene: 5, packagingQuality: 5, punctuality: 4 },
    description: 'Granular aspect ratings as key-value pairs',
  })
  @IsOptional()
  @IsObject()
  aspects?: Record<string, number>;
}
