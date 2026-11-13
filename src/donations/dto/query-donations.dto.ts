import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
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
}
