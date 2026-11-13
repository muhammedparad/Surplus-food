import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'teammate@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Organization-scoped role ID; defaults to org_member if omitted',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({
    example: 'org_member',
    description: 'Organization-scoped role slug if roleId is not supplied',
  })
  @IsOptional()
  @IsString()
  roleSlug?: string;
}
