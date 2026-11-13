import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import {
  FoodCategory,
  FoodRequestStatus,
  FoodType,
  RequestPriority,
} from '../../generated/prisma/enums.js';

export class QueryFoodRequestsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: FoodRequestStatus, default: FoodRequestStatus.OPEN })
  @IsOptional()
  @IsEnum(FoodRequestStatus)
  status?: FoodRequestStatus = FoodRequestStatus.OPEN;

  @ApiPropertyOptional({ enum: RequestPriority })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;

  @ApiPropertyOptional({ enum: FoodCategory })
  @IsOptional()
  @IsEnum(FoodCategory)
  foodCategory?: FoodCategory;

  @ApiPropertyOptional({ enum: FoodType })
  @IsOptional()
  @IsEnum(FoodType)
  foodType?: FoodType;

  @ApiPropertyOptional({ description: 'Filter by posting NGO UUID' })
  @IsOptional()
  @IsUUID('4')
  ngoId?: string;
}
