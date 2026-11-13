import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  QueryNotificationsDto,
  RegisterDeviceDto,
  UpdateNotificationPreferenceDto,
} from './dto/notification.dto.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // --- Device Tokens for Push Notifications ---

  async registerDevice(dto: RegisterDeviceDto, actor: AuthenticatedUser) {
    const token = dto.deviceToken.trim();
    if (!token) {
      throw new BadRequestException('A non-empty device token is required');
    }

    return this.prisma.userDevice.upsert({
      where: { deviceToken: token },
      update: {
        userId: actor.id,
        platform: dto.platform,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId: actor.id,
        deviceToken: token,
        platform: dto.platform,
        isActive: true,
      },
    });
  }

  async unregisterDevice(deviceToken: string, actor: AuthenticatedUser) {
    const device = await this.prisma.userDevice.findUnique({
      where: { deviceToken },
    });

    if (device && device.userId === actor.id) {
      await this.prisma.userDevice.update({
        where: { deviceToken },
        data: { isActive: false },
      });
    }

    return { success: true };
  }

  // --- In-App Notifications ---

  async listNotifications(
    query: QueryNotificationsDto,
    actor: AuthenticatedUser,
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    const skip = (page - 1) * limit;

    const where = {
      userId: actor.id,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id: string, actor: AuthenticatedUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== actor.id) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(actor: AuthenticatedUser) {
    await this.prisma.notification.updateMany({
      where: { userId: actor.id, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  // --- Notification Preferences ---

  async getPreferences(actor: AuthenticatedUser) {
    return this.prisma.notificationPreference.findMany({
      where: { userId: actor.id },
    });
  }

  async updatePreference(
    dto: UpdateNotificationPreferenceDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_notificationType: {
          userId: actor.id,
          notificationType: dto.notificationType,
        },
      },
      update: {
        ...(dto.pushEnabled !== undefined ? { pushEnabled: dto.pushEnabled } : {}),
        ...(dto.emailEnabled !== undefined ? { emailEnabled: dto.emailEnabled } : {}),
      },
      create: {
        userId: actor.id,
        notificationType: dto.notificationType,
        pushEnabled: dto.pushEnabled ?? true,
        emailEnabled: dto.emailEnabled ?? true,
      },
    });
  }

  // --- Reliable Outbox Publishing & Processing ---

  async publishOutboxEvent(
    eventType: string,
    aggregateType: string,
    aggregateId: string,
    payload: Record<string, any>,
    txClient?: any,
  ) {
    const client = txClient ?? this.prisma;
    return client.outboxEvent.create({
      data: {
        eventType,
        aggregateType,
        aggregateId,
        payload,
      },
    });
  }

  async processPendingOutboxEvents(batchSize: number = 50): Promise<number> {
    const pending = await this.prisma.outboxEvent.findMany({
      where: { processedAt: null },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    if (!pending.length) {
      return 0;
    }

    for (const event of pending) {
      try {
        await this.handleOutboxEvent(event);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date() },
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to process outbox event ${event.id} (${event.eventType}): ${err.message}`,
        );
      }
    }

    return pending.length;
  }

  private async handleOutboxEvent(event: any) {
    const payload = event.payload as Record<string, any>;
    const targetUserIds = new Set<string>();

    if (payload.recipientUserIds && Array.isArray(payload.recipientUserIds)) {
      for (const id of payload.recipientUserIds) {
        targetUserIds.add(id);
      }
    } else if (payload.userId) {
      targetUserIds.add(payload.userId);
    }

    for (const userId of targetUserIds) {
      const pref = await this.prisma.notificationPreference.findUnique({
        where: {
          userId_notificationType: {
            userId,
            notificationType: event.eventType,
          },
        },
      });

      const pushEnabled = pref?.pushEnabled ?? true;

      // 1. Create in-app notification
      await this.prisma.notification.create({
        data: {
          userId,
          title: payload.title ?? `Update: ${event.eventType}`,
          message: payload.message ?? 'You have a new update regarding food redistribution.',
          type: event.eventType,
          referenceType: event.aggregateType,
          referenceId: event.aggregateId,
        },
      });

      // 2. Dispatch Push Notification to registered devices if enabled
      if (pushEnabled) {
        const devices = await this.prisma.userDevice.findMany({
          where: { userId, isActive: true },
        });

        for (const dev of devices) {
          // Push notification dispatch hook (FCM / APNs)
          this.logger.log(
            `[PUSH DISPATCH] Sent to device (${dev.platform}): ${dev.deviceToken.substring(0, 10)}... | ${payload.title}`,
          );
        }
      }
    }
  }
}
