import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignUserRoleDto {
  @ApiProperty({ format: 'uuid', description: 'Global role ID to assign to user' })
  @IsUUID()
  roleId!: string;
}
