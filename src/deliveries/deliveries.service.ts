import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { CryptoService } from '../common/services/crypto.service.js';
import {
  ClaimStatus,
  DeliveryStatus,
  VerificationStatus,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ScanDeliveryDto,
  ScanPickupDto,
} from './dto/delivery-handshake.dto.js';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cryptoService: CryptoService,
  ) {}

  private async getVerifiedVolunteerProfile(userId: string) {
    const profile = await this.prisma.volunteerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new ForbiddenException('Volunteer profile not found. Please register as a volunteer first.');
    }

    if (profile.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Your volunteer profile is currently pending verification. You cannot accept delivery tasks yet.',
      );
    }

    if (!profile.isAvailable) {
      throw new ForbiddenException(
        'Your status is currently set to unavailable. Please toggle availability on to accept tasks.',
      );
    }

    return profile;
  }

  async listAvailableTasks(actor: AuthenticatedUser) {
    const profile = await this.getVerifiedVolunteerProfile(actor.id);

    // Rule 1: A volunteer can only have connection with ONE donation at a time!
    const activeTask = await this.prisma.delivery.findFirst({
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
    });

    if (activeTask) {
      throw new ConflictException(
        'You already have an active delivery task in progress. You must complete or cancel it before accepting another task.',
      );
    }

    return this.prisma.delivery.findMany({
      where: {
        status: DeliveryStatus.PENDING,
        volunteerId: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        donationClaim: {
          include: {
            donation: {
              select: {
                id: true,
                foodName: true,
                category: true,
                foodType: true,
                unit: true,
                storageType: true,
                collectionDeadline: true,
                pickupPoint: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                  },
                },
                organization: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            ngo: {
              select: {
                id: true,
                name: true,
                deliveryLocations: {
                  where: { isActive: true },
                  select: { id: true, name: true, address: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  async acceptDelivery(deliveryId: string, actor: AuthenticatedUser) {
    const profile = await this.getVerifiedVolunteerProfile(actor.id);

    return this.prisma.$transaction(async (tx) => {
      // Strict Invariant: Check active tasks inside transaction
      const activeTask = await tx.delivery.findFirst({
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
      });

      if (activeTask) {
        throw new ConflictException(
          'You already have an active delivery in progress. You can only take one donation at a time.',
        );
      }

      const delivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          donationClaim: {
            include: {
              donation: { include: { pickupPoint: true } },
              ngo: { include: { deliveryLocations: { where: { isActive: true }, take: 1 } } },
            },
          },
        },
      });

      if (!delivery) {
        throw new NotFoundException('Delivery task not found');
      }

      if (delivery.status !== DeliveryStatus.PENDING || delivery.volunteerId !== null) {
        throw new ConflictException('This delivery task has already been claimed by another volunteer');
      }

      const updated = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          volunteerId: profile.id,
          status: DeliveryStatus.ACCEPTED,
          acceptedAt: new Date(),
          events: {
            create: {
              actorId: actor.id,
              eventType: 'VOLUNTEER_ACCEPTED',
              description: `Task accepted by volunteer ${actor.name}`,
            },
          },
        },
      });

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.DELIVERY_ACCEPTED,
          targetType: 'Delivery',
          targetId: deliveryId,
          metadata: {
            volunteerId: profile.id,
            donationId: delivery.donationClaim.donationId,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async confirmPickup(
    deliveryId: string,
    dto: ScanPickupDto,
    actor: AuthenticatedUser,
  ) {
    const profile = await this.prisma.volunteerProfile.findUnique({
      where: { userId: actor.id },
    });

    if (!profile) {
      throw new ForbiddenException('Volunteer profile not found');
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery task not found');
    }

    if (delivery.volunteerId !== profile.id) {
      throw new ForbiddenException('You are not the assigned volunteer for this delivery task');
    }

    if (
      delivery.status !== DeliveryStatus.ACCEPTED &&
      delivery.status !== DeliveryStatus.ASSIGNED
    ) {
      throw new ConflictException(`Cannot confirm pickup for delivery in status "${delivery.status}"`);
    }

    // Optical QR code verification OR numeric fallback code
    let verified = false;
    if (dto.qrToken && delivery.pickupQrToken && dto.qrToken.trim() === delivery.pickupQrToken) {
      verified = true;
    } else if (dto.code && delivery.pickupCodeHash) {
      const hash = this.cryptoService.sha256(dto.code.trim());
      if (hash === delivery.pickupCodeHash) {
        verified = true;
      }
    }

    if (!verified) {
      throw new BadRequestException(
        'Pickup verification failed: Scanned QR token or 6-digit code does not match',
      );
    }

    const now = new Date();

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: DeliveryStatus.IN_TRANSIT,
        pickedUpAt: now,
        events: {
          create: {
            actorId: actor.id,
            eventType: 'FOOD_PICKED_UP',
            description: 'Food collected from restaurant; volunteer now in transit to NGO',
          },
        },
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.DELIVERY_PICKED_UP,
      targetType: 'Delivery',
      targetId: deliveryId,
      metadata: { pickedUpAt: now.toISOString() },
    });

    return updated;
  }

  async confirmDelivery(
    deliveryId: string,
    dto: ScanDeliveryDto,
    actor: AuthenticatedUser,
  ) {
    const profile = await this.prisma.volunteerProfile.findUnique({
      where: { userId: actor.id },
    });

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        donationClaim: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery task not found');
    }

    if (delivery.status !== DeliveryStatus.IN_TRANSIT) {
      throw new ConflictException(
        `Cannot confirm delivery before pickup. Current status: "${delivery.status}"`,
      );
    }

    // Optical QR code verification OR numeric fallback code
    let verified = false;
    if (
      dto.qrToken &&
      delivery.deliveryQrToken &&
      dto.qrToken.trim() === delivery.deliveryQrToken
    ) {
      verified = true;
    } else if (dto.code && delivery.deliveryCodeHash) {
      const hash = this.cryptoService.sha256(dto.code.trim());
      if (hash === delivery.deliveryCodeHash) {
        verified = true;
      }
    }

    if (!verified) {
      throw new BadRequestException(
        'Delivery verification failed: Scanned NGO QR token or 6-digit code does not match',
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.DELIVERED,
          deliveredAt: now,
          events: {
            create: {
              actorId: actor.id,
              eventType: 'FOOD_DELIVERED',
              description: 'Food successfully delivered to NGO shelter and verified via handshake',
            },
          },
        },
      });

      await tx.donationClaim.update({
        where: { id: delivery.donationClaimId },
        data: { status: ClaimStatus.COMPLETED },
      });

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.DELIVERY_COMPLETED,
          targetType: 'Delivery',
          targetId: deliveryId,
          metadata: { deliveredAt: now.toISOString() },
        },
        tx,
      );

      return updatedDelivery;
    });
  }

  async getLiveTracking(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        volunteer: {
          select: {
            transportType: true,
            currentLatitude: true,
            currentLongitude: true,
            lastLocationUpdate: true,
            user: { select: { name: true, phone: true } },
          },
        },
        donationClaim: {
          include: {
            donation: { select: { foodName: true, unit: true, category: true } },
            ngo: {
              select: {
                name: true,
                deliveryLocations: { where: { isActive: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return {
      deliveryId: delivery.id,
      status: delivery.status,
      estimatedArrivalAt: delivery.estimatedArrivalAt,
      currentLatitude: delivery.currentLatitude,
      currentLongitude: delivery.currentLongitude,
      pickedUpAt: delivery.pickedUpAt,
      deliveredAt: delivery.deliveredAt,
      food: {
        name: delivery.donationClaim.donation.foodName,
        quantity: Number(
          delivery.donationClaim.approvedQuantity ?? delivery.donationClaim.requestedQuantity,
        ),
        unit: delivery.donationClaim.donation.unit,
      },
      volunteer: delivery.volunteer
        ? {
            name: delivery.volunteer.user.name,
            phone: delivery.volunteer.user.phone,
            transportType: delivery.volunteer.transportType,
            lastLocationPing: delivery.volunteer.lastLocationUpdate,
          }
        : null,
      ngo: {
        name: delivery.donationClaim.ngo.name,
        destination: delivery.donationClaim.ngo.deliveryLocations[0]?.address ?? null,
      },
    };
  }
}
