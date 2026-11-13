import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserStatus } from '../../generated/prisma/enums.js';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED] })
  @IsEnum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED])
  status!: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

  @ApiPropertyOptional({ example: 'Violation of acceptable use policy' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
