import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GoogleIdTokenDto {
  @ApiProperty({
    description: 'Google OIDC ID token issued by Google Sign-In SDK (verified server-side)',
  })
  @IsString()
  @MinLength(20)
  idToken!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  useCookies?: boolean = false;
}

export class LinkGooglePrepareDto {
  @ApiPropertyOptional({
    description: 'Current password required to prove ownership before linking Google',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;
}

export class LinkGoogleIdTokenDto {
  @ApiProperty({ description: 'Verified Google OIDC ID token' })
  @IsString()
  @MinLength(20)
  idToken!: string;

  @ApiPropertyOptional({
    description: 'Current password required to prove account ownership when password is set',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;
}
