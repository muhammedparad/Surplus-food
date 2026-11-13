import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import { AuditService } from '../audit/audit.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import { CryptoService } from '../common/services/crypto.service.js';
import {
  ClaimStatus,
  DeliveryStatus,
  DonationStatus,
  FoodRequestStatus,
  FulfillmentStatus,
  OrganizationType,
  VerificationStatus,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateFoodRequestDto,
  ProposeFulfillmentDto,
} from './dto/food-request.dto.js';
import type { QueryFoodRequestsDto } from './dto/query-food-requests.dto.js';

@Injectable()
export class FoodRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cryptoService: CryptoService,
    private readonly authLookup: AuthorizationLookupService,
  ) {}

  private async assertOrgMembership(
    organizationId: string,
    actor: AuthenticatedUser,
    requiredRole?: 'leader',
  ) {
    const { roleSlugs: globalRoles } =
      await this.authLookup.getGlobalRolesAndPermissions(actor.id);
    if (globalRoles.includes('super_admin') || globalRoles.includes('admin')) {
      return;
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: actor.id,
        },
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('Not an active member of this organization');
    }

    if (requiredRole === 'leader') {
      const isLeader = membership.roles.some((r) =>
        ['org_owner', 'org_admin'].includes(r.role.slug),
      );
      if (!isLeader) {
        throw new ForbiddenException(
          'Requires organization owner or administrator privilege',
        );
      }
    }
  }

  async createRequest(dto: CreateFoodRequestDto, actor: AuthenticatedUser) {
    await this.assertOrgMembership(dto.ngoId, actor, 'leader');

    const ngo = await this.prisma.organization.findUnique({
      where: { id: dto.ngoId },
    });

    if (!ngo || ngo.type !== OrganizationType.NGO) {
      throw new BadRequestException('Only registered NGO organizations can post advance food requests');
    }

    if (ngo.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Only verified NGOs can post advance food requests. Please submit verification documents first.',
      );
    }

    const deliveryLocation = await this.prisma.deliveryLocation.findFirst({
      where: {
        id: dto.deliveryLocationId,
        organizationId: dto.ngoId,
        isActive: true,
      },
    });

    if (!deliveryLocation) {
      throw new BadRequestException('Delivery location does not belong to this NGO or is inactive');
    }

    const requiredDate = new Date(dto.requiredDate);
    const requiredBefore = new Date(dto.requiredBefore);

    if (requiredBefore <= new Date()) {
      throw new BadRequestException('Required deadline cannot be in the past');
    }

    return this.prisma.ngoFoodRequest.create({
      data: {
        ngoId: dto.ngoId,
        foodCategory: dto.foodCategory,
        foodType: dto.foodType,
        requiredQuantity: dto.requiredQuantity,
        unit: dto.unit,
        requiredDate,
        requiredBefore,
        deliveryLocationId: dto.deliveryLocationId,
        priority: dto.priority,
        notes: dto.notes?.trim(),
        status: FoodRequestStatus.OPEN,
      },
      include: {
        ngo: { select: { id: true, name: true, phone: true } },
        deliveryLocation: true,
      },
    });
  }

  async listRequests(query: QueryFoodRequestsDto): Promise<PaginatedResult<any>> {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    const skip = (page - 1) * limit;

    const where: any = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.foodCategory ? { foodCategory: query.foodCategory } : {}),
      ...(query.foodType ? { foodType: query.foodType } : {}),
      ...(query.ngoId ? { ngoId: query.ngoId } : {}),
    };

    const [total, requests] = await Promise.all([
      this.prisma.ngoFoodRequest.count({ where }),
      this.prisma.ngoFoodRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { requiredBefore: 'asc' }],
        include: {
          ngo: { select: { id: true, name: true, phone: true, verificationStatus: true } },
          deliveryLocation: { select: { id: true, name: true, address: true } },
          fulfillments: {
            where: { status: FulfillmentStatus.ACCEPTED },
            select: { allocatedQuantity: true },
          },
        },
      }),
    ]);

    const items = requests.map((req) => {
      const fulfilledSum = req.fulfillments.reduce(
        (sum, f) => sum + Number(f.allocatedQuantity),
        0,
      );
      const remainingNeeded = Math.max(0, Number(req.requiredQuantity) - fulfilledSum);
      const { fulfillments, ...rest } = req;
      return {
        ...rest,
        fulfilledQuantity: fulfilledSum,
        remainingNeeded,
      };
    });

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

  async getRequestById(id: string) {
    const request = await this.prisma.ngoFoodRequest.findUnique({
      where: { id },
      include: {
        ngo: { select: { id: true, name: true, phone: true, verificationStatus: true } },
        deliveryLocation: true,
        fulfillments: {
          include: {
            donation: {
              select: {
                id: true,
                foodName: true,
                totalQuantity: true,
                unit: true,
                organization: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Food request not found');
    }

    const acceptedSum = request.fulfillments
      .filter((f) => f.status === FulfillmentStatus.ACCEPTED)
      .reduce((sum, f) => sum + Number(f.allocatedQuantity), 0);

    const remainingNeeded = Math.max(0, Number(request.requiredQuantity) - acceptedSum);

    return {
      ...request,
      fulfilledQuantity: acceptedSum,
      remainingNeeded,
    };
  }

  async proposeFulfillment(
    requestId: string,
    dto: ProposeFulfillmentDto,
    actor: AuthenticatedUser,
  ) {
    const request = await this.prisma.ngoFoodRequest.findUnique({
      where: { id: requestId },
      include: {
        fulfillments: {
          where: { status: FulfillmentStatus.ACCEPTED },
          select: { allocatedQuantity: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Food request not found');
    }

    if (
      request.status !== FoodRequestStatus.OPEN &&
      request.status !== FoodRequestStatus.PARTIALLY_FULFILLED
    ) {
      throw new ConflictException(`Cannot propose fulfillment for request in status "${request.status}"`);
    }

    const acceptedSum = request.fulfillments.reduce(
      (sum, f) => sum + Number(f.allocatedQuantity),
      0,
    );
    const remainingNeeded = Number(request.requiredQuantity) - acceptedSum;

    if (dto.allocatedQuantity > remainingNeeded) {
      throw new BadRequestException(
        `Proposed quantity (${dto.allocatedQuantity}) exceeds remaining needed quantity (${remainingNeeded})`,
      );
    }

    const donation = await this.prisma.donation.findUnique({
      where: { id: dto.donationId },
      include: {
        claims: {
          where: { status: ClaimStatus.APPROVED },
          select: { approvedQuantity: true },
        },
      },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    await this.assertOrgMembership(donation.organizationId, actor, 'leader');

    if (donation.status !== DonationStatus.AVAILABLE) {
      throw new BadRequestException('Donation is not available for fulfillment');
    }

    const totalApprovedClaims = donation.claims.reduce(
      (sum, c) => sum + Number(c.approvedQuantity ?? 0),
      0,
    );
    const donationRemaining = Number(donation.totalQuantity) - totalApprovedClaims;

    if (dto.allocatedQuantity > donationRemaining) {
      throw new ConflictException(
        `Proposed quantity (${dto.allocatedQuantity}) exceeds available remaining food in donation (${donationRemaining})`,
      );
    }

    return this.prisma.ngoRequestFulfillment.create({
      data: {
        requestId,
        donationId: dto.donationId,
        allocatedQuantity: dto.allocatedQuantity,
        status: FulfillmentStatus.PROPOSED,
      },
      include: {
        request: { select: { id: true, foodCategory: true, requiredDate: true } },
        donation: { select: { id: true, foodName: true, unit: true } },
      },
    });
  }

  async acceptFulfillment(fulfillmentId: string, actor: AuthenticatedUser) {
    const fulfillment = await this.prisma.ngoRequestFulfillment.findUnique({
      where: { id: fulfillmentId },
      include: {
        request: true,
        donation: true,
      },
    });

    if (!fulfillment) {
      throw new NotFoundException('Fulfillment proposal not found');
    }

    if (fulfillment.status !== FulfillmentStatus.PROPOSED) {
      throw new ConflictException(`Cannot accept fulfillment with status "${fulfillment.status}"`);
    }

    await this.assertOrgMembership(fulfillment.request.ngoId, actor, 'leader');

    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
    const deliveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    const pickupQrToken = crypto.randomUUID();
    const deliveryQrToken = crypto.randomUUID();

    const pickupCodeHash = this.cryptoService.sha256(pickupCode);
    const deliveryCodeHash = this.cryptoService.sha256(deliveryCode);

    return this.prisma.$transaction(async (tx) => {
      // Rule: Fulfillment must create corresponding donation claim and delivery to prevent double counting
      const claim = await tx.donationClaim.create({
        data: {
          donationId: fulfillment.donationId,
          ngoId: fulfillment.request.ngoId,
          requestedQuantity: fulfillment.allocatedQuantity,
          approvedQuantity: fulfillment.allocatedQuantity,
          status: ClaimStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedById: actor.id,
        },
      });

      const delivery = await tx.delivery.create({
        data: {
          donationClaimId: claim.id,
          status: DeliveryStatus.PENDING,
          pickupCodeHash,
          deliveryCodeHash,
          pickupQrToken,
          deliveryQrToken,
          events: {
            create: {
              actorId: actor.id,
              eventType: 'DELIVERY_CREATED',
              description: `Delivery initiated from accepted advance request fulfillment of ${fulfillment.allocatedQuantity} ${fulfillment.donation.unit}`,
            },
          },
        },
      });

      const updatedFulfillment = await tx.ngoRequestFulfillment.update({
        where: { id: fulfillmentId },
        data: { status: FulfillmentStatus.ACCEPTED },
      });

      const allAcceptedFulfillments = await tx.ngoRequestFulfillment.findMany({
        where: {
          requestId: fulfillment.requestId,
          status: FulfillmentStatus.ACCEPTED,
        },
        select: { allocatedQuantity: true },
      });

      const totalAccepted = allAcceptedFulfillments.reduce(
        (sum, f) => sum + Number(f.allocatedQuantity),
        0,
      );

      const requestStatus =
        totalAccepted >= Number(fulfillment.request.requiredQuantity)
          ? FoodRequestStatus.FULFILLED
          : FoodRequestStatus.PARTIALLY_FULFILLED;

      await tx.ngoFoodRequest.update({
        where: { id: fulfillment.requestId },
        data: { status: requestStatus },
      });

      return {
        ...updatedFulfillment,
        claimId: claim.id,
        delivery: {
          id: delivery.id,
          status: delivery.status,
          pickupCode,
          pickupQrToken,
          deliveryCode,
          deliveryQrToken,
        },
      };
    });
  }

  async rejectFulfillment(fulfillmentId: string, actor: AuthenticatedUser) {
    const fulfillment = await this.prisma.ngoRequestFulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { request: true },
    });

    if (!fulfillment) {
      throw new NotFoundException('Fulfillment proposal not found');
    }

    if (fulfillment.status !== FulfillmentStatus.PROPOSED) {
      throw new ConflictException(`Cannot reject fulfillment with status "${fulfillment.status}"`);
    }

    await this.assertOrgMembership(fulfillment.request.ngoId, actor, 'leader');

    return this.prisma.ngoRequestFulfillment.update({
      where: { id: fulfillmentId },
      data: { status: FulfillmentStatus.REJECTED },
    });
  }
}
