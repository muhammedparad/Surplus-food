import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DevicePlatform } from '../generated/prisma/enums.js';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: any;

  const mockActor: any = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Sample User',
  };

  beforeEach(() => {
    mockPrisma = {
      userDevice: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      notification: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
      },
      notificationPreference: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      outboxEvent: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new NotificationsService(mockPrisma);
  });

  it('registers a user device token for push alerts', async () => {
    mockPrisma.userDevice.upsert.mockResolvedValue({
      id: 'dev-1',
      userId: mockActor.id,
      deviceToken: 'fcm-token-123',
      platform: DevicePlatform.ANDROID,
      isActive: true,
    });

    const result = await service.registerDevice(
      { deviceToken: 'fcm-token-123', platform: DevicePlatform.ANDROID },
      mockActor,
    );

    expect(result.deviceToken).toBe('fcm-token-123');
    expect(mockPrisma.userDevice.upsert).toHaveBeenCalled();
  });

  it('marks a user notification as read', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({
      id: 'notif-1',
      userId: mockActor.id,
      isRead: false,
    });
    mockPrisma.notification.update.mockResolvedValue({
      id: 'notif-1',
      isRead: true,
    });

    const result = await service.markAsRead('notif-1', mockActor);

    expect(result.isRead).toBe(true);
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { isRead: true },
    });
  });

  it('processes pending outbox events and writes in-app notifications', async () => {
    mockPrisma.outboxEvent.findMany.mockResolvedValue([
      {
        id: 'outbox-1',
        eventType: 'CLAIM_APPROVED',
        aggregateType: 'DonationClaim',
        aggregateId: 'claim-1',
        payload: {
          recipientUserIds: [mockActor.id],
          title: 'Claim Approved!',
          message: 'Your food claim for 30 meals was approved.',
        },
      },
    ]);

    mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
    mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });
    mockPrisma.userDevice.findMany.mockResolvedValue([
      { deviceToken: 'device-token-123', platform: 'ANDROID' },
    ]);
    mockPrisma.outboxEvent.update.mockResolvedValue({ id: 'outbox-1' });

    const processedCount = await service.processPendingOutboxEvents();

    expect(processedCount).toBe(1);
    expect(mockPrisma.notification.create).toHaveBeenCalled();
    expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'outbox-1' },
      data: expect.objectContaining({ processedAt: expect.any(Date) }),
    });
  });
});
