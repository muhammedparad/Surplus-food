import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import type { TrackingGateway } from '../deliveries/tracking.gateway.js';
import { DeliveryStatus } from '../generated/prisma/enums.js';
import { VolunteersService } from './volunteers.service.js';

describe('VolunteersService - Live Location & Tracking Integration', () => {
  let service: VolunteersService;
  let mockPrisma: any;
  let mockTrackingGateway: Partial<TrackingGateway>;

  const mockActor: AuthenticatedUser = {
    id: 'user-vol-1',
    email: 'courier@charity.org',
    roles: ['volunteer'],
    permissions: ['delivery:update'],
  } as unknown as AuthenticatedUser;

  const mockVolunteerProfile = {
    id: 'profile-vol-1',
    userId: mockActor.id,
    currentLatitude: 40.71,
    currentLongitude: -74.00,
    lastLocationUpdate: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {
      volunteerProfile: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      delivery: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      deliveryEvent: {
        create: vi.fn(),
      },
    };

    mockTrackingGateway = {
      broadcastLocationUpdate: vi.fn(),
    };

    service = new VolunteersService(
      mockPrisma,
      mockTrackingGateway as TrackingGateway,
    );
  });

  it('updates volunteer coordinates and broadcasts live location & ETA when volunteer has active delivery in transit', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue(mockVolunteerProfile);
    mockPrisma.volunteerProfile.update.mockResolvedValue({
      ...mockVolunteerProfile,
      currentLatitude: 40.7128,
      currentLongitude: -74.006,
    });

    const activeDelivery = {
      id: 'delivery-uuid-1',
      volunteerId: mockVolunteerProfile.id,
      status: DeliveryStatus.IN_TRANSIT,
      donationClaim: {
        ngo: {
          deliveryLocations: [
            {
              latitude: 40.758,
              longitude: -73.9855,
              isActive: true,
            },
          ],
        },
      },
    };
    mockPrisma.delivery.findFirst.mockResolvedValue(activeDelivery);
    mockPrisma.delivery.update.mockResolvedValue({ ...activeDelivery, currentLatitude: 40.7128 });
    mockPrisma.deliveryEvent.create.mockResolvedValue({ id: 'event-1' });

    const result = await service.updateLocation(
      { latitude: 40.7128, longitude: -74.006 },
      mockActor,
    );

    expect(result.updated).toBe(true);
    expect(result.latitude).toBe(40.7128);
    expect(result.longitude).toBe(-74.006);

    // Verify delivery updated
    expect(mockPrisma.delivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: activeDelivery.id },
        data: expect.objectContaining({
          currentLatitude: 40.7128,
          currentLongitude: -74.006,
          estimatedArrivalAt: expect.any(Date),
        }),
      }),
    );

    // Verify tracking gateway broadcast was invoked with correct payload
    expect(mockTrackingGateway.broadcastLocationUpdate).toHaveBeenCalledWith(
      activeDelivery.id,
      expect.objectContaining({
        latitude: 40.7128,
        longitude: -74.006,
        status: DeliveryStatus.IN_TRANSIT,
        estimatedArrivalAt: expect.any(Date),
      }),
    );
  });

  it('updates volunteer coordinates without calling tracking broadcast when there is no active delivery', async () => {
    mockPrisma.volunteerProfile.findUnique.mockResolvedValue(mockVolunteerProfile);
    mockPrisma.volunteerProfile.update.mockResolvedValue({
      ...mockVolunteerProfile,
      currentLatitude: 40.7128,
      currentLongitude: -74.006,
    });
    mockPrisma.delivery.findFirst.mockResolvedValue(null);

    const result = await service.updateLocation(
      { latitude: 40.7128, longitude: -74.006 },
      mockActor,
    );

    expect(result.updated).toBe(true);
    expect(mockPrisma.delivery.update).not.toHaveBeenCalled();
    expect(mockTrackingGateway.broadcastLocationUpdate).not.toHaveBeenCalled();
  });
});
