import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  FoodCategory,
  FoodType,
  FoodUnit,
  RequestPriority,
} from '../../generated/prisma/enums.js';

export class CreateFoodRequestDto {
  @ApiProperty({
    example: 'd9b2b63d-a4c3-4d2d-8fa0-6f920da68181',
    description: 'NGO Organization ID posting this advance requirement',
  })
  @IsUUID('4')
  ngoId!: string;

  @ApiProperty({ enum: FoodCategory, example: FoodCategory.MEALS })
  @IsEnum(FoodCategory)
  foodCategory!: FoodCategory;

  @ApiProperty({ enum: FoodType, example: FoodType.VEG })
  @IsEnum(FoodType)
  foodType!: FoodType;

  @ApiProperty({ example: 100, description: 'Quantity needed' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  requiredQuantity!: number;

  @ApiProperty({ enum: FoodUnit, example: FoodUnit.MEALS })
  @IsEnum(FoodUnit)
  unit!: FoodUnit;

  @ApiProperty({ example: '2026-11-20', description: 'Date when the food is needed (YYYY-MM-DD)' })
  @IsDateString()
  requiredDate!: string;

  @ApiProperty({
    example: '2026-11-20T17:00:00Z',
    description: 'Target delivery deadline (latest time food must arrive)',
  })
  @IsDateString()
  requiredBefore!: string;

  @ApiProperty({
    example: 'c8a1b63d-a4c3-4d2d-8fa0-6f920da68199',
    description: 'Delivery drop-off location UUID belonging to this NGO',
  })
  @IsUUID('4')
  deliveryLocationId!: string;

  @ApiPropertyOptional({
    enum: RequestPriority,
    example: RequestPriority.HIGH,
    default: RequestPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority = RequestPriority.NORMAL;

  @ApiPropertyOptional({
    example: 'Dinner community kitchen serving homeless families. Warm cooked meals or rice/lentils preferred.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ProposeFulfillmentDto {
  @ApiProperty({
    example: 'don-uuid-1234',
    description: 'Donation UUID from which surplus food is being allocated',
  })
  @IsUUID('4')
  donationId!: string;

  @ApiProperty({
    example: 50,
    description: 'Quantity allocated from this donation toward the NGO requirement',
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  allocatedQuantity!: number;
}
