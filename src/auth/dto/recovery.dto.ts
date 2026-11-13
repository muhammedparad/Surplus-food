import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Single-use email verification token' })
  @IsString()
  @MinLength(20)
  token!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Single-use password reset token' })
  @IsString()
  @MinLength(20)
  token!: string;

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
}
