import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PermissionScope } from '../../generated/prisma/enums.js';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'project:create',
    description: 'Granular permission key following resource:action format',
  })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/, {
    message: 'Permission key must follow lowercase resource:action format (e.g. project:create)',
  })
  @MaxLength(120)
  key!: string;

  @ApiPropertyOptional({ example: 'Allow creating new projects' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: PermissionScope, default: PermissionScope.BOTH })
  @IsOptional()
  @IsEnum(PermissionScope)
  scope?: PermissionScope = PermissionScope.BOTH;
}
