import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { VerificationStatus } from '../../generated/prisma/enums.js';

export class ReviewVerificationDto {
  @ApiProperty({
    enum: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
    example: VerificationStatus.VERIFIED,
    description: 'Outcome of the admin verification review (VERIFIED or REJECTED)',
  })
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @ApiPropertyOptional({
    example: 'Expired food hygiene certificate. Please upload current valid license.',
    description: 'Required explanation if rejecting verification',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}
