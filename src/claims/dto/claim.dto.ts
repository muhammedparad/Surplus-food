import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateClaimDto {
  @ApiProperty({
    example: 'd9b2b63d-a4c3-4d2d-8fa0-6f920da68181',
    description: 'NGO Organization ID claiming the food',
  })
  @IsUUID('4')
  ngoId!: string;

  @ApiProperty({
    example: 30,
    description: 'Requested food quantity (in donation unit, e.g., meals or kg)',
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  requestedQuantity!: number;
}

export class ApproveClaimDto {
  @ApiPropertyOptional({
    example: 30,
    description: 'Actual approved allocation (defaults to requestedQuantity if omitted)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  approvedQuantity?: number;
}

export class RejectClaimDto {
  @ApiPropertyOptional({
    example: 'All surplus meals have already been allocated to shelter dinner service.',
    description: 'Reason for rejecting claim',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
