import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import {
  DonationStatus,
  FoodCategory,
  FoodType,
  StorageType,
} from '../../generated/prisma/enums.js';

export class QueryDonationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DonationStatus, default: DonationStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(DonationStatus)
  status?: DonationStatus = DonationStatus.AVAILABLE;

  @ApiPropertyOptional({ enum: FoodCategory })
  @IsOptional()
  @IsEnum(FoodCategory)
  category?: FoodCategory;

  @ApiPropertyOptional({ enum: FoodType })
  @IsOptional()
  @IsEnum(FoodType)
  foodType?: FoodType;

  @ApiPropertyOptional({ enum: StorageType })
  @IsOptional()
  @IsEnum(StorageType)
  storageType?: StorageType;

  @ApiPropertyOptional({ description: 'Filter by donating organization UUID' })
  @IsOptional()
  @IsUUID('4')
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Filter for items permitting direct public beneficiary pickup' })
  @Transform(({ value }) => (value !== undefined ? value === 'true' || value === true : undefined))
  @IsOptional()
  @IsBoolean()
  allowPublicPickup?: boolean;

  @ApiPropertyOptional({ description: 'Filter by event type (e.g. WEDDING, CONFERENCE)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  eventType?: string;
}
