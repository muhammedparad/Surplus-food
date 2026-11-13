import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleScope } from '../../generated/prisma/enums.js';

export class CreateRoleDto {
  @ApiProperty({ example: 'Content Editor' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({
    example: 'content_editor',
    description: 'Canonical lowercase slug; derived from name if omitted',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with underscores or hyphens',
  })
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({ example: 'Can manage published content' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: RoleScope, default: RoleScope.GLOBAL })
  @IsOptional()
  @IsEnum(RoleScope)
  scope?: RoleScope = RoleScope.GLOBAL;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional organization ID when creating an organization-specific custom role',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
