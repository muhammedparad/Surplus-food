import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class InvitationTokenDto {
  @ApiProperty({ description: 'Single-use invitation token received via email' })
  @IsString()
  @MinLength(20)
  token!: string;
}
