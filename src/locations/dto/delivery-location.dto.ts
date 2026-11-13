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

export class CreateDeliveryLocationDto {
  @ApiProperty({
    example: 'd9b2b63d-a4c3-4d2d-8fa0-6f920da68181',
    description: 'NGO Organization ID receiving deliveries here',
  })
  @IsUUID('4')
  organizationId!: string;

  @ApiProperty({
    example: 'Main Community Dining Hall',
    description: 'Name or label for the drop-off location',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: '45 Elm Street, Ground Floor Shelter',
    description: 'Physical delivery address',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address!: string;

  @ApiPropertyOptional({ example: 40.7135 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -74.008 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    example: 'Ask for Shelter Supervisor Maria at the reception desk.',
    description: 'Specific drop-off or recipient instructions',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class UpdateDeliveryLocationDto {
  @ApiPropertyOptional({ example: 'Main Community Dining Hall' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '45 Elm Street, Ground Floor Shelter' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: 40.7135 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -74.008 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Ask for supervisor Maria' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
