import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import {
  QueryNotificationsDto,
  RegisterDeviceDto,
  UpdateNotificationPreferenceDto,
} from './dto/notification.dto.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('Notifications & Push Delivery')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('devices')
  @ApiOperation({ summary: 'Register FCM / APNs device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token registered' })
  async registerDevice(
    @Body() dto: RegisterDeviceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notificationsService.registerDevice(dto, actor);
  }

  @Delete('devices/:deviceToken')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister device token on logout' })
  @ApiParam({ name: 'deviceToken', description: 'Device token string' })
  async unregisterDevice(
    @Param('deviceToken') deviceToken: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notificationsService.unregisterDevice(deviceToken, actor);
  }

  @Get()
  @ApiOperation({ summary: 'List user notifications with optional unread filter' })
  @ApiResponse({ status: 200, description: 'Paginated user notifications' })
  async listNotifications(
    @Query() query: QueryNotificationsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notificationsService.listNotifications(query, actor);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notificationsService.markAsRead(id, actor);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  async markAllAsRead(@CurrentUser() actor: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(actor);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification delivery preferences (push & email toggles)' })
  async getPreferences(@CurrentUser() actor: AuthenticatedUser) {
    return this.notificationsService.getPreferences(actor);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification delivery preferences' })
  async updatePreference(
    @Body() dto: UpdateNotificationPreferenceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notificationsService.updatePreference(dto, actor);
  }

  @Post('outbox/process')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Trigger processing batch of pending outbox events (Admin or scheduler)' })
  async processOutbox() {
    const count = await this.notificationsService.processPendingOutboxEvents();
    return { processedEvents: count };
  }
}
