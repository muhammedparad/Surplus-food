import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import {
  ClaimStatus,
  DonationStatus,
  VerificationStatus,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateDonationDto } from './dto/create-donation.dto.js';
import type { QueryDonationsDto } from './dto/query-donations.dto.js';
import type { UpdateDonationDto } from './dto/update-donation.dto.js';

@Injectable()
export class DonationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly authLookup: AuthorizationLookupService,
  ) {}

  private async assertCanManageDonations(
    organizationId: string,
    actor: AuthenticatedUser,
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
      throw new ForbiddenException('Not an active member of this donating organization');
    }

    const hasPermission = membership.roles.some((r) =>
      ['org_owner', 'org_admin'].includes(r.role.slug),
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'Insufficient organization role to create or manage food donations',
      );
    }
  }

  async createDonation(dto: CreateDonationDto, actor: AuthenticatedUser) {
    if (!dto.safetyDeclared) {
      throw new BadRequestException(
        'Provider must explicitly declare food safety and hygienic storage compliance',
      );
    }

    const preparedAt = new Date(dto.preparedAt);
    const availableFrom = new Date(dto.availableFrom);
    const collectionDeadline = new Date(dto.collectionDeadline);

    if (collectionDeadline <= availableFrom) {
      throw new BadRequestException('Collection deadline must be later than availableFrom time');
    }

    if (collectionDeadline <= new Date()) {
      throw new BadRequestException('Collection deadline cannot be in the past');
    }

    await this.assertCanManageDonations(dto.organizationId, actor);

    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!org) {
      throw new NotFoundException('Donating organization not found');
    }

    const pickupPoint = await this.prisma.pickupPoint.findFirst({
      where: {
        id: dto.pickupPointId,
        organizationId: dto.organizationId,
        isActive: true,
      },
    });
    if (!pickupPoint) {
      throw new BadRequestException('Specified pickup point does not belong to this organization');
    }

    return this.prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          organizationId: dto.organizationId,
          foodName: dto.foodName.trim(),
          description: dto.description?.trim(),
          category: dto.category,
          foodType: dto.foodType,
          totalQuantity: dto.totalQuantity,
          unit: dto.unit,
          preparedAt,
          availableFrom,
          collectionDeadline,
          storageType: dto.storageType,
          pickupPointId: dto.pickupPointId,
          safetyDeclared: dto.safetyDeclared,
          eventName: dto.eventName?.trim() ?? null,
          eventType: dto.eventType?.trim() ?? null,
          venueContactName: dto.venueContactName?.trim() ?? null,
          venueContactPhone: dto.venueContactPhone?.trim() ?? null,
          allowPublicPickup: dto.allowPublicPickup ?? false,
          publicPickupInstructions: dto.publicPickupInstructions?.trim() ?? null,
          status: DonationStatus.AVAILABLE,
          images: dto.imageUrls?.length
            ? {
                create: dto.imageUrls.map((imageUrl, idx) => ({
                  imageUrl,
                  sortOrder: idx,
                })),
              }
            : undefined,
          allergens: dto.allergenIds?.length
            ? {
                create: dto.allergenIds.map((allergenId) => ({
                  allergenId,
                })),
              }
            : undefined,
        },
        include: {
          images: true,
          allergens: { include: { allergen: true } },
          pickupPoint: true,
          organization: { select: { id: true, name: true, type: true, verificationStatus: true } },
        },
      });

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.DONATION_CREATED,
          targetType: 'Donation',
          targetId: donation.id,
          organizationId: dto.organizationId,
          metadata: {
            foodName: donation.foodName,
            totalQuantity: donation.totalQuantity.toString(),
            unit: donation.unit,
          },
        },
        tx,
      );

      return donation;
    });
  }

  async listDonations(query: QueryDonationsDto): Promise<PaginatedResult<any>> {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    const skip = (page - 1) * limit;

    const now = new Date();
    const where: any = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.foodType ? { foodType: query.foodType } : {}),
      ...(query.storageType ? { storageType: query.storageType } : {}),
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.allowPublicPickup !== undefined ? { allowPublicPickup: query.allowPublicPickup } : {}),
      ...(query.eventType ? { eventType: query.eventType } : {}),
    };

    if (query.status === DonationStatus.AVAILABLE) {
      where.collectionDeadline = { gt: now };
    }

    const [total, donations] = await Promise.all([
      this.prisma.donation.count({ where }),
      this.prisma.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { collectionDeadline: 'asc' },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          allergens: { include: { allergen: true } },
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              verificationStatus: true,
            },
          },
          pickupPoint: {
            select: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          claims: {
            where: { status: ClaimStatus.APPROVED },
            select: { approvedQuantity: true },
          },
        },
      }),
    ]);

    const items = donations.map((d) => {
      const approvedSum = d.claims.reduce(
        (sum, c) => sum + Number(c.approvedQuantity ?? 0),
        0,
      );
      const remainingQuantity = Math.max(0, Number(d.totalQuantity) - approvedSum);
      const { claims, ...rest } = d;
      return {
        ...rest,
        remainingQuantity,
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

  async getDonationById(id: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        allergens: { include: { allergen: true } },
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            phone: true,
            verificationStatus: true,
          },
        },
        pickupPoint: true,
        claims: {
          select: {
            id: true,
            requestedQuantity: true,
            approvedQuantity: true,
            status: true,
            ngo: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    const approvedSum = donation.claims
      .filter((c) => c.status === ClaimStatus.APPROVED)
      .reduce((sum, c) => sum + Number(c.approvedQuantity ?? 0), 0);

    const remainingQuantity = Math.max(0, Number(donation.totalQuantity) - approvedSum);

    return {
      ...donation,
      remainingQuantity,
    };
  }

  async updateDonation(
    id: string,
    dto: UpdateDonationDto,
    actor: AuthenticatedUser,
  ) {
    const existing = await this.prisma.donation.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Donation not found');
    }

    await this.assertCanManageDonations(existing.organizationId, actor);

    return this.prisma.donation.update({
      where: { id },
      data: {
        ...(dto.foodName !== undefined ? { foodName: dto.foodName.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.foodType !== undefined ? { foodType: dto.foodType } : {}),
        ...(dto.totalQuantity !== undefined ? { totalQuantity: dto.totalQuantity } : {}),
        ...(dto.collectionDeadline !== undefined ? { collectionDeadline: new Date(dto.collectionDeadline) } : {}),
        ...(dto.storageType !== undefined ? { storageType: dto.storageType } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.pickupPointId !== undefined ? { pickupPointId: dto.pickupPointId } : {}),
        ...(dto.safetyDeclared !== undefined ? { safetyDeclared: dto.safetyDeclared } : {}),
        ...(dto.eventName !== undefined ? { eventName: dto.eventName?.trim() ?? null } : {}),
        ...(dto.eventType !== undefined ? { eventType: dto.eventType?.trim() ?? null } : {}),
        ...(dto.venueContactName !== undefined ? { venueContactName: dto.venueContactName?.trim() ?? null } : {}),
        ...(dto.venueContactPhone !== undefined ? { venueContactPhone: dto.venueContactPhone?.trim() ?? null } : {}),
        ...(dto.allowPublicPickup !== undefined ? { allowPublicPickup: dto.allowPublicPickup } : {}),
        ...(dto.publicPickupInstructions !== undefined ? { publicPickupInstructions: dto.publicPickupInstructions?.trim() ?? null } : {}),
      },
      include: {
        images: true,
        allergens: { include: { allergen: true } },
        pickupPoint: true,
      },
    });
  }

  async cancelDonation(id: string, actor: AuthenticatedUser) {
    const existing = await this.prisma.donation.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Donation not found');
    }

    await this.assertCanManageDonations(existing.organizationId, actor);

    return this.prisma.donation.update({
      where: { id },
      data: { status: DonationStatus.CANCELLED },
    });
  }

  async listAllergens() {
    return this.prisma.foodAllergen.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
