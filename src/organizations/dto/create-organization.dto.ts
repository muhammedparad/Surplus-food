import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { OrganizationType } from '../../generated/prisma/enums.js';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Green Bistro Downtown' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    example: 'green-bistro-downtown',
    description: 'Unique lowercase organization slug; derived from name if omitted',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Organization slug must be lowercase alphanumeric with hyphens',
  })
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({
    enum: OrganizationType,
    example: OrganizationType.RESTAURANT,
    description: 'Type of organization (RESTAURANT, NGO, BAKERY, CATERER)',
  })
  @IsOptional()
  @IsEnum(OrganizationType)
  type?: OrganizationType;

  @ApiPropertyOptional({ example: 'Surplus food donor specializing in fresh prepared lunches' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'contact@greenbistro.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-0199' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    example: 'FSSAI-1234567890',
    description: 'Business or NGO registration / tax-exemption number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @ApiPropertyOptional({
    example: '123 Main Street, Suite 400 (Corporate Headquarters - Private)',
    description: 'Private registered corporate address (never exposed as pickup address)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  registeredAddress?: string;

  @ApiPropertyOptional({ example: 40.7128, description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -74.006, description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the organization profile is hidden from public discovery',
  })
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @ApiPropertyOptional({
    example: 200,
    description: 'For NGOs: number of daily beneficiaries supported',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  beneficiaryCount?: number;

  @ApiPropertyOptional({
    example: 150,
    description: 'For NGOs: maximum meal storage/serving capacity per delivery batch',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  servingCapacity?: number;
}
