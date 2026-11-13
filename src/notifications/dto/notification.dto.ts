import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { DevicePlatform } from '../../generated/prisma/enums.js';

export class RegisterDeviceDto {
  @ApiProperty({
    example: 'fcm-device-registration-token-abc-123...',
    description: 'Firebase Cloud Messaging (FCM) or Apple Push Notification (APNs) device token',
  })
  @IsString()
  @IsNotEmpty()
  deviceToken!: string;

  @ApiProperty({
    enum: DevicePlatform,
    example: DevicePlatform.ANDROID,
    description: 'Target platform (ANDROID, IOS, WEB)',
  })
  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;
}

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ example: 'DELIVERY_UPDATE', description: 'Notification type classification' })
  @IsString()
  @IsNotEmpty()
  notificationType!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;
}

export class QueryNotificationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter only unread notifications' })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}
