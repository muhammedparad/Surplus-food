import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  FoodCategory,
  FoodType,
  FoodUnit,
  StorageType,
} from '../../generated/prisma/enums.js';

export class CreateDonationDto {
  @ApiProperty({
    example: 'd9b2b63d-a4c3-4d2d-8fa0-6f920da68181',
    description: 'Organization ID donating the food (Restaurant, Bakery, Caterer)',
  })
  @IsUUID('4')
  organizationId!: string;

  @ApiProperty({
    example: 'Fresh Vegetable Dum Biryani',
    description: 'Name of the prepared food or grocery batch',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  foodName!: string;

  @ApiPropertyOptional({
    example: 'Freshly cooked surplus from corporate lunch buffet. Stored in hot holding cabinets.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: FoodCategory, example: FoodCategory.MEALS })
  @IsEnum(FoodCategory)
  category!: FoodCategory;

  @ApiProperty({ enum: FoodType, example: FoodType.VEG })
  @IsEnum(FoodType)
  foodType!: FoodType;

  @ApiProperty({ example: 50, description: 'Total available surplus quantity' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalQuantity!: number;

  @ApiProperty({ enum: FoodUnit, example: FoodUnit.MEALS })
  @IsEnum(FoodUnit)
  unit!: FoodUnit;

  @ApiProperty({ example: '2026-11-13T13:30:00Z', description: 'When the food was cooked/prepared' })
  @IsDateString()
  preparedAt!: string;

  @ApiProperty({ example: '2026-11-13T15:00:00Z', description: 'When pickup can begin' })
  @IsDateString()
  availableFrom!: string;

  @ApiProperty({ example: '2026-11-13T20:00:00Z', description: 'Last safe consumption/collection cutoff' })
  @IsDateString()
  collectionDeadline!: string;

  @ApiProperty({ enum: StorageType, example: StorageType.HOT })
  @IsEnum(StorageType)
  storageType!: StorageType;

  @ApiProperty({
    example: 'c9b2b63d-a4c3-4d2d-8fa0-6f920da68199',
    description: 'Pickup point ID where the food will be collected',
  })
  @IsUUID('4')
  pickupPointId!: string;

  @ApiProperty({
    example: true,
    description: 'Mandatory food safety and hygienic storage declaration by provider',
  })
  @IsBoolean()
  safetyDeclared!: boolean;

  @ApiPropertyOptional({
    example: ['e8a1b63d-a4c3-4d2d-8fa0-6f920da68122'],
    description: 'List of FoodAllergen UUIDs contained in this food',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  allergenIds?: string[];

  @ApiPropertyOptional({
    example: ['https://storage.example.com/photos/biryani-tray-1.jpg'],
    description: 'Photo URLs of the food trays / packaging',
  })
  @IsOptional()
  @IsArray()
  @IsUrl({ require_tld: false }, { each: true })
  imageUrls?: string[];
}
