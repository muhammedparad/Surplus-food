import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeliveryStatus, PickupMode, VerificationStatus } from '../generated/prisma/enums.js';
import { DeliveriesService } from './deliveries.service.js';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockCrypto: any;
  let mockAuthLookup: any;

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
      organizationMember: {
        findUnique: vi.fn(),
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

    mockAuthLookup = {
      getGlobalRolesAndPermissions: vi.fn().mockResolvedValue({
        roleSlugs: ['customer'],
        permissionKeys: ['delivery:accept'],
      }),
    };

    service = new DeliveriesService(mockPrisma, mockAudit, mockCrypto, mockAuthLookup);
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
      pickupMode: PickupMode.VOLUNTEER,
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

  it('rejects volunteer acceptance if delivery mode is DIRECT_NGO', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue(mockVolunteerProfile);
    mockPrisma.delivery.findFirst.mockResolvedValue(null);
    mockPrisma.delivery.findUnique.mockResolvedValue({
      id: 'del-direct',
      status: DeliveryStatus.PENDING,
      volunteerId: null,
      pickupMode: PickupMode.DIRECT_NGO, // Not for volunteers!
      donationClaim: { donationId: 'don-1' },
    });

    await expect(service.acceptDelivery('del-direct', mockActor)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('completes 1-step direct NGO pickup when NGO member scans restaurant QR code', async () => {
    const mockNgoUser = { id: 'user-sarah', name: 'Sarah NGO Lead' };
    mockPrisma.delivery.findUnique.mockResolvedValue({
      id: 'del-direct-1',
      status: DeliveryStatus.PENDING,
      pickupMode: PickupMode.DIRECT_NGO,
      pickupQrToken: 'provider-qr-999',
      pickupCodeHash: 'hash_555444',
      donationClaim: {
        id: 'claim-10',
        ngoId: 'ngo-org-1',
        donationId: 'don-10',
      },
    });

    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      organizationId: 'ngo-org-1',
      userId: mockNgoUser.id,
      status: 'ACTIVE',
    });

    mockPrisma.delivery.update.mockResolvedValue({
      id: 'del-direct-1',
      status: DeliveryStatus.DELIVERED,
      pickupMode: PickupMode.DIRECT_NGO,
    });

    const result = await service.confirmDirectHandover(
      'del-direct-1',
      { qrToken: 'provider-qr-999' },
      mockNgoUser as any,
    );

    expect(result.status).toBe(DeliveryStatus.DELIVERED);
    expect(mockPrisma.delivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'del-direct-1' },
        data: expect.objectContaining({
          status: DeliveryStatus.DELIVERED,
        }),
      }),
    );
    expect(mockAudit.record).toHaveBeenCalled();
  });
});
