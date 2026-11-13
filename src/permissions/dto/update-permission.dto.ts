import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PermissionScope } from '../../generated/prisma/enums.js';

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'Updated permission description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: PermissionScope })
  @IsOptional()
  @IsEnum(PermissionScope)
  scope?: PermissionScope;
}
