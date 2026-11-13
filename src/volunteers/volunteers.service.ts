import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { TrackingGateway } from '../deliveries/tracking.gateway.js';
import {
  DeliveryStatus,
  VerificationStatus,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateVolunteerProfileDto,
  UpdateAvailabilityDto,
  UpdateLocationDto,
} from './dto/volunteer.dto.js';

function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class VolunteersService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly trackingGateway?: TrackingGateway,
  ) {}

  async createProfile(dto: CreateVolunteerProfileDto, actor: AuthenticatedUser) {
    const existing = await this.prisma.volunteerProfile.findUnique({
      where: { userId: actor.id },
    });
    if (existing) {
      throw new ConflictException('You already have a volunteer profile registered');
    }

    return this.prisma.volunteerProfile.create({
      data: {
        userId: actor.id,
        transportType: dto.transportType,
        maxCapacity: dto.maxCapacity,
        capacityUnit: dto.capacityUnit?.trim().toUpperCase(),
        verificationStatus: VerificationStatus.PENDING,
        isAvailable: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  }

  async getMyProfile(actor: AuthenticatedUser) {
    const profile = await this.prisma.volunteerProfile.findUnique({
      where: { userId: actor.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        deliveries: {
          where: {
            status: {
              in: [
                DeliveryStatus.ASSIGNED,
                DeliveryStatus.ACCEPTED,
                DeliveryStatus.PICKED_UP,
                DeliveryStatus.IN_TRANSIT,
              ],
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Volunteer profile not found. Please create one first.');
    }

    const activeDelivery = profile.deliveries[0] ?? null;

    return {
      ...profile,
      hasActiveTask: Boolean(activeDelivery),
      activeDeliveryId: activeDelivery?.id ?? null,
    };
  }

  async setAvailability(dto: UpdateAvailabilityDto, actor: AuthenticatedUser) {
    const profile = await this.prisma.volunteerProfile.findUnique({
      where: { userId: actor.id },
    });
    if (!profile) {
      throw new NotFoundException('Volunteer profile not found');
    }

    return this.prisma.volunteerProfile.update({
      where: { id: profile.id },
      data: { isAvailable: dto.isAvailable },
    });
  }

  async updateLocation(dto: UpdateLocationDto, actor: AuthenticatedUser) {
    const profile = await this.prisma.volunteerProfile.findUnique({
      where: { userId: actor.id },
    });
    if (!profile) {
      throw new NotFoundException('Volunteer profile not found');
    }

    const now = new Date();

    const updatedProfile = await this.prisma.volunteerProfile.update({
      where: { id: profile.id },
      data: {
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
        lastLocationUpdate: now,
      },
    });

    const activeDelivery = await this.prisma.delivery.findFirst({
      where: {
        volunteerId: profile.id,
        status: DeliveryStatus.IN_TRANSIT,
      },
      include: {
        donationClaim: {
          include: {
            ngo: {
              include: {
                deliveryLocations: {
                  where: { isActive: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (activeDelivery) {
      const dropoff = activeDelivery.donationClaim.ngo.deliveryLocations[0];
      let estimatedArrivalAt: Date | undefined;

      if (dropoff?.latitude && dropoff?.longitude) {
        const distanceKm = calculateHaversineDistanceKm(
          dto.latitude,
          dto.longitude,
          Number(dropoff.latitude),
          Number(dropoff.longitude),
        );

        // Average city transit speed ~ 25 km/h -> 0.416 km/min
        const minutes = Math.max(2, Math.round(distanceKm / (25 / 60)));
        estimatedArrivalAt = new Date(now.getTime() + minutes * 60 * 1000);
      }

      await this.prisma.delivery.update({
        where: { id: activeDelivery.id },
        data: {
          currentLatitude: dto.latitude,
          currentLongitude: dto.longitude,
          ...(estimatedArrivalAt ? { estimatedArrivalAt } : {}),
        },
      });

      await this.prisma.deliveryEvent.create({
        data: {
          deliveryId: activeDelivery.id,
          actorId: actor.id,
          eventType: 'LOCATION_PING',
          latitude: dto.latitude,
          longitude: dto.longitude,
          description: `Volunteer in transit ping (lat: ${dto.latitude}, lng: ${dto.longitude})`,
        },
      });

      if (this.trackingGateway) {
        this.trackingGateway.broadcastLocationUpdate(activeDelivery.id, {
          latitude: dto.latitude,
          longitude: dto.longitude,
          estimatedArrivalAt: estimatedArrivalAt ?? null,
          status: activeDelivery.status,
        });
      }
    }

    return {
      updated: true,
      latitude: updatedProfile.currentLatitude,
      longitude: updatedProfile.currentLongitude,
      timestamp: now,
    };
  }

  async getActiveTask(actor: AuthenticatedUser) {
    const profile = await this.prisma.volunteerProfile.findUnique({
      where: { userId: actor.id },
    });
    if (!profile) {
      throw new NotFoundException('Volunteer profile not found');
    }

    const delivery = await this.prisma.delivery.findFirst({
      where: {
        volunteerId: profile.id,
        status: {
          in: [
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.ACCEPTED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.IN_TRANSIT,
          ],
        },
      },
      include: {
        donationClaim: {
          include: {
            donation: {
              include: {
                pickupPoint: true,
                organization: { select: { id: true, name: true, phone: true } },
              },
            },
            ngo: {
              include: {
                deliveryLocations: { where: { isActive: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      return { activeTask: null };
    }

    const { donation, ngo, requestedQuantity, approvedQuantity } =
      delivery.donationClaim;
    const dropoffPoint = ngo.deliveryLocations[0] ?? null;

    return {
      activeTask: {
        deliveryId: delivery.id,
        status: delivery.status,
        quantity: Number(approvedQuantity ?? requestedQuantity),
        unit: donation.unit,
        foodName: donation.foodName,
        category: donation.category,
        foodType: donation.foodType,
        storageType: donation.storageType,
        collectionDeadline: donation.collectionDeadline,
        estimatedArrivalAt: delivery.estimatedArrivalAt,
        pickup: {
          restaurantName: donation.organization.name,
          restaurantPhone: donation.organization.phone,
          pickupPointName: donation.pickupPoint.name,
          pickupAddress: donation.pickupPoint.address,
          instructions: donation.pickupPoint.instructions,
          latitude: donation.pickupPoint.latitude,
          longitude: donation.pickupPoint.longitude,
          pickupQrToken: delivery.pickupQrToken,
        },
        dropoff: {
          ngoName: ngo.name,
          ngoPhone: ngo.phone,
          locationName: dropoffPoint?.name ?? 'Main Shelter',
          deliveryAddress: dropoffPoint?.address ?? 'NGO Registered Address',
          instructions: dropoffPoint?.instructions,
          latitude: dropoffPoint?.latitude,
          longitude: dropoffPoint?.longitude,
          deliveryQrToken: delivery.deliveryQrToken,
        },
      },
    };
  }
}
