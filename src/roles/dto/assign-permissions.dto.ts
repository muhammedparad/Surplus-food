import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AssignPermissionsDto {
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Permission UUIDs to assign to the role',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  permissionIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['user:read', 'audit:read'],
    description: 'Permission keys (resource:action) to assign to the role',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionKeys?: string[];

  @ApiPropertyOptional({
    enum: ['add', 'replace'],
    default: 'add',
    description: 'Whether to append permissions or replace the role permission set',
  })
  @IsOptional()
  @IsIn(['add', 'replace'])
  mode?: 'add' | 'replace' = 'add';
}
