import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { TransportType } from '../../generated/prisma/enums.js';

export class CreateVolunteerProfileDto {
  @ApiProperty({
    enum: TransportType,
    example: TransportType.MOTORBIKE,
    description: 'Volunteer vehicle / transport type (WALKING, BICYCLE, MOTORBIKE, CAR, OTHER)',
  })
  @IsEnum(TransportType)
  transportType!: TransportType;

  @ApiPropertyOptional({
    example: 40,
    description: 'Maximum carrying capacity (e.g. 40 meals or 25 kg)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  maxCapacity?: number;

  @ApiPropertyOptional({
    example: 'MEALS',
    description: 'Unit of capacity (MEALS, KG, PACKETS)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  capacityUnit?: string;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ example: true, description: 'Toggle whether you are currently ready to accept tasks' })
  @IsBoolean()
  isAvailable!: boolean;
}

export class UpdateLocationDto {
  @ApiProperty({ example: 40.7128, description: 'Current GPS latitude' })
  @IsNumber()
  @Type(() => Number)
  latitude!: number;

  @ApiProperty({ example: -74.006, description: 'Current GPS longitude' })
  @IsNumber()
  @Type(() => Number)
  longitude!: number;
}
