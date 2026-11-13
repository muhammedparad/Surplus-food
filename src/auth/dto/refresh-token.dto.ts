import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Opaque refresh token (optional if sent via HttpOnly refresh_token cookie)',
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  refreshToken?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  useCookies?: boolean = true;
}
