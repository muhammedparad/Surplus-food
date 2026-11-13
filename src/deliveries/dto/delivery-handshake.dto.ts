import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class ScanPickupDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Scanned optical QR token presented by restaurant',
  })
  @IsOptional()
  @IsString()
  qrToken?: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Fallback 6-digit numeric pickup code from restaurant staff',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  code?: string;
}

export class ScanDeliveryDto {
  @ApiPropertyOptional({
    example: '660e8400-e29b-41d4-a716-446655440000',
    description: 'Scanned optical QR token presented by NGO shelter staff',
  })
  @IsOptional()
  @IsString()
  qrToken?: string;

  @ApiPropertyOptional({
    example: '654321',
    description: 'Fallback 6-digit numeric delivery code provided by shelter supervisor',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  code?: string;
}

export class ScanDirectHandoverDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Optical QR token presented by food provider for direct 1-step NGO pickup',
  })
  @IsOptional()
  @IsString()
  qrToken?: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Fallback 6-digit numeric pickup code from food provider staff',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  code?: string;
}
