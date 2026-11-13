import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { VerificationStatus } from '../../generated/prisma/enums.js';

export class QueryVerificationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: VerificationStatus,
    description: 'Filter by verification status (PENDING, APPROVED, REJECTED)',
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;
}
