import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Current password (required when account already has a password set)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;

  @ApiProperty({ example: 'NewStrongP@ssword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;

  @ApiProperty({ example: 'NewStrongP@ssword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  confirmPassword!: string;

  @ApiPropertyOptional({
    default: false,
    description: 'When true, also revokes the current active session',
  })
  @IsOptional()
  @IsBoolean()
  revokeCurrentSession?: boolean = false;
}
