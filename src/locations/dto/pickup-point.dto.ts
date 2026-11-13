import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePickupPointDto {
  @ApiProperty({
    example: 'd9b2b63d-a4c3-4d2d-8fa0-6f920da68181',
    description: 'Organization ID owning this pickup point',
  })
  @IsUUID('4')
  organizationId!: string;

  @ApiProperty({
    example: 'Kitchen Back Door / Loading Bay 2',
    description: 'Name or label for the pickup spot',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'Alley behind 123 Main St, Gate 2',
    description: 'Physical pickup address',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address!: string;

  @ApiPropertyOptional({ example: 40.7128 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -74.006 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    example: 'Ring the service doorbell labeled "Deliveries". Staff will hand over the insulated crates.',
    description: 'Special access instructions (only revealed to assigned volunteers)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class UpdatePickupPointDto {
  @ApiPropertyOptional({ example: 'Kitchen Back Door - Updated' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Alley behind 123 Main St, Gate 2' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: 40.7128 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -74.006 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Ring doorbell 2' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
