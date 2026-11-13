import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class UpdateMemberRolesDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Organization-scoped role IDs to assign to the member',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds!: string[];
}

export class SwitchOrganizationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;
}
