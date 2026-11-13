import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeliveryStatus, VerificationStatus } from '../generated/prisma/enums.js';
import { DeliveriesService } from './deliveries.service.js';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockCrypto: any;

  const mockActor: any = {
    id: 'user-alex',
    email: 'alex@volunteer.com',
    name: 'Alex Volunteer',
  };

  const mockVolunteerProfile = {
    id: 'vol-profile-1',
    userId: mockActor.id,
    verificationStatus: VerificationStatus.VERIFIED,
    isAvailable: true,
  };

  beforeEach(() => {
    mockPrisma = {
      volunteerProfile: {
        findUnique: vi.fn(),
      },
      delivery: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      donationClaim: {
        update: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    };

    mockAudit = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    mockCrypto = {
      sha256: vi.fn((val) => `hash_${val}`),
    };

    service = new DeliveriesService(mockPrisma, mockAudit, mockCrypto);
  });

  it('blocks unverified volunteers from claiming delivery tasks', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue({
      ...mockVolunteerProfile,
      verificationStatus: VerificationStatus.PENDING, // Not verified!
    });

    await expect(service.listAvailableTasks(mockActor)).rejects.toThrow(ForbiddenException);
  });

  it('strictly enforces single active task: blocks listing tasks if volunteer already has an active task', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue(mockVolunteerProfile);
    mockPrisma.delivery.findFirst.mockResolvedValue({
      id: 'active-delivery-1',
      status: DeliveryStatus.IN_TRANSIT,
    });

    await expect(service.listAvailableTasks(mockActor)).rejects.toThrow(ConflictException);
  });

  it('strictly enforces single active task: blocks accepting a second task if one is in progress', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue(mockVolunteerProfile);
    mockPrisma.delivery.findFirst.mockResolvedValue({
      id: 'active-delivery-1',
      status: DeliveryStatus.ACCEPTED,
    });

    await expect(service.acceptDelivery('del-2', mockActor)).rejects.toThrow(ConflictException);
  });

  it('accepts available task and assigns volunteer when they have no active tasks', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue(mockVolunteerProfile);
    mockPrisma.delivery.findFirst.mockResolvedValue(null); // No active task!
    mockPrisma.delivery.findUnique.mockResolvedValue({
      id: 'del-1',
      status: DeliveryStatus.PENDING,
      volunteerId: null,
      donationClaim: { donationId: 'don-1' },
    });
    mockPrisma.delivery.update.mockResolvedValue({
      id: 'del-1',
      volunteerId: mockVolunteerProfile.id,
      status: DeliveryStatus.ACCEPTED,
    });

    const result = await service.acceptDelivery('del-1', mockActor);

    expect(result.status).toBe(DeliveryStatus.ACCEPTED);
    expect(mockPrisma.delivery.update).toHaveBeenCalled();
    expect(mockAudit.record).toHaveBeenCalled();
  });

  it('successfully verifies pickup via optical QR token', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue(mockVolunteerProfile);
    mockPrisma.delivery.findUnique.mockResolvedValue({
      id: 'del-1',
      volunteerId: mockVolunteerProfile.id,
      status: DeliveryStatus.ACCEPTED,
      pickupQrToken: 'qr-token-abc-123',
      pickupCodeHash: 'hash_123456',
    });
    mockPrisma.delivery.update.mockResolvedValue({
      id: 'del-1',
      status: DeliveryStatus.IN_TRANSIT,
    });

    const result = await service.confirmPickup(
      'del-1',
      { qrToken: 'qr-token-abc-123' },
      mockActor,
    );

    expect(result.status).toBe(DeliveryStatus.IN_TRANSIT);
  });

  it('successfully verifies pickup via fallback 6-digit numeric code', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue(mockVolunteerProfile);
    mockPrisma.delivery.findUnique.mockResolvedValue({
      id: 'del-1',
      volunteerId: mockVolunteerProfile.id,
      status: DeliveryStatus.ACCEPTED,
      pickupQrToken: 'qr-token-abc-123',
      pickupCodeHash: 'hash_123456',
    });
    mockPrisma.delivery.update.mockResolvedValue({
      id: 'del-1',
      status: DeliveryStatus.IN_TRANSIT,
    });

    const result = await service.confirmPickup(
      'del-1',
      { code: '123456' },
      mockActor,
    );

    expect(result.status).toBe(DeliveryStatus.IN_TRANSIT);
  });

  it('rejects pickup if neither QR token nor 6-digit code matches', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue(mockVolunteerProfile);
    mockPrisma.delivery.findUnique.mockResolvedValue({
      id: 'del-1',
      volunteerId: mockVolunteerProfile.id,
      status: DeliveryStatus.ACCEPTED,
      pickupQrToken: 'qr-token-abc-123',
      pickupCodeHash: 'hash_123456',
    });

    await expect(
      service.confirmPickup('del-1', { code: '999999' }, mockActor),
    ).rejects.toThrow(BadRequestException);
  });

  it('completes delivery upon valid NGO handshake and marks claim completed', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue(mockVolunteerProfile);
    mockPrisma.delivery.findUnique.mockResolvedValue({
      id: 'del-1',
      volunteerId: mockVolunteerProfile.id,
      status: DeliveryStatus.IN_TRANSIT,
      donationClaimId: 'claim-1',
      deliveryQrToken: 'ngo-qr-xyz-987',
      deliveryCodeHash: 'hash_654321',
    });
    mockPrisma.delivery.update.mockResolvedValue({
      id: 'del-1',
      status: DeliveryStatus.DELIVERED,
    });

    const result = await service.confirmDelivery(
      'del-1',
      { qrToken: 'ngo-qr-xyz-987' },
      mockActor,
    );

    expect(result.status).toBe(DeliveryStatus.DELIVERED);
    expect(mockPrisma.donationClaim.update).toHaveBeenCalledWith({
      where: { id: 'claim-1' },
      data: { status: 'COMPLETED' },
    });
  });
});
