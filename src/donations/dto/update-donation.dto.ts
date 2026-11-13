import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  DonationStatus,
  FoodCategory,
  FoodType,
  StorageType,
} from '../../generated/prisma/enums.js';

export class UpdateDonationDto {
  @ApiPropertyOptional({ example: 'Fresh Vegetable Dum Biryani (Large Batch)' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  foodName?: string;

  @ApiPropertyOptional({ example: 'Updated packaging instructions.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: FoodCategory })
  @IsOptional()
  @IsEnum(FoodCategory)
  category?: FoodCategory;

  @ApiPropertyOptional({ enum: FoodType })
  @IsOptional()
  @IsEnum(FoodType)
  foodType?: FoodType;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalQuantity?: number;

  @ApiPropertyOptional({ example: '2026-11-13T21:00:00Z' })
  @IsOptional()
  @IsDateString()
  collectionDeadline?: string;

  @ApiPropertyOptional({ enum: StorageType })
  @IsOptional()
  @IsEnum(StorageType)
  storageType?: StorageType;

  @ApiPropertyOptional({ enum: DonationStatus })
  @IsOptional()
  @IsEnum(DonationStatus)
  status?: DonationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  pickupPointId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  safetyDeclared?: boolean;

  @ApiPropertyOptional({ example: 'Global Climate Summit Banquet' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  eventName?: string;

  @ApiPropertyOptional({ example: 'CONFERENCE' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  eventType?: string;

  @ApiPropertyOptional({ example: 'David Miller' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  venueContactName?: string;

  @ApiPropertyOptional({ example: '+1-555-0142' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  venueContactPhone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowPublicPickup?: boolean;

  @ApiPropertyOptional({ example: 'Community food table outside main hall gate B' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  publicPickupInstructions?: string;
}
