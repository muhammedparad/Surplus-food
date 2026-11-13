import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import { CryptoService } from '../common/services/crypto.service.js';
import {
  ClaimStatus,
  DeliveryStatus,
  DonationStatus,
  OrganizationType,
  PickupMode,
  VerificationStatus,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ApproveClaimDto,
  CreateClaimDto,
  RejectClaimDto,
} from './dto/claim.dto.js';

@Injectable()
export class ClaimsService {
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

  async submitClaim(
    donationId: string,
    dto: CreateClaimDto,
    actor: AuthenticatedUser,
  ) {
    await this.assertOrgMembership(dto.ngoId, actor);

    const ngo = await this.prisma.organization.findUnique({
      where: { id: dto.ngoId },
    });

    if (!ngo || ngo.type !== OrganizationType.NGO) {
      throw new BadRequestException('Only registered NGO organizations can claim food donations');
    }

    if (ngo.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Only verified NGOs can claim donations. Please submit official verification documents first.',
      );
    }

    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        claims: {
          where: { status: { in: [ClaimStatus.APPROVED, ClaimStatus.COMPLETED] } },
          select: { approvedQuantity: true },
        },
      },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    if (donation.status !== DonationStatus.AVAILABLE) {
      throw new BadRequestException(`Donation is no longer available (current status: ${donation.status})`);
    }

    if (donation.collectionDeadline <= new Date()) {
      throw new BadRequestException('The collection deadline for this food donation has expired');
    }

    const approvedSum = donation.claims.reduce(
      (sum, c) => sum + Number(c.approvedQuantity ?? 0),
      0,
    );
    const remaining = Number(donation.totalQuantity) - approvedSum;

    if (remaining <= 0) {
      throw new BadRequestException('This donation is already fully allocated to other NGO claims');
    }

    if (dto.requestedQuantity > remaining) {
      throw new BadRequestException(
        `Requested quantity (${dto.requestedQuantity}) exceeds remaining available quantity (${remaining})`,
      );
    }

    const activeClaim = await this.prisma.donationClaim.findFirst({
      where: {
        donationId,
        ngoId: dto.ngoId,
        status: { in: [ClaimStatus.PENDING, ClaimStatus.APPROVED] },
      },
    });

    if (activeClaim) {
      throw new ConflictException(
        `Your NGO already has an active claim on this donation (status: ${activeClaim.status})`,
      );
    }

    return this.prisma.donationClaim.create({
      data: {
        donationId,
        ngoId: dto.ngoId,
        requestedQuantity: dto.requestedQuantity,
        pickupMode: dto.pickupMode ?? PickupMode.VOLUNTEER,
        status: ClaimStatus.PENDING,
      },
      include: {
        donation: { select: { id: true, foodName: true, totalQuantity: true, unit: true } },
        ngo: { select: { id: true, name: true } },
      },
    });
  }

  async approveClaim(
    claimId: string,
    dto: ApproveClaimDto,
    actor: AuthenticatedUser,
  ) {
    const claim = await this.prisma.donationClaim.findUnique({
      where: { id: claimId },
      include: {
        donation: true,
        ngo: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim record not found');
    }

    if (claim.status !== ClaimStatus.PENDING) {
      throw new ConflictException(`Cannot approve claim with status "${claim.status}"`);
    }

    await this.assertOrgMembership(claim.donation.organizationId, actor, 'leader');

    const approvedQuantity = dto.approvedQuantity ?? Number(claim.requestedQuantity);

    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
    const deliveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    const pickupQrToken = crypto.randomUUID();
    const deliveryQrToken = crypto.randomUUID();

    const pickupCodeHash = this.cryptoService.sha256(pickupCode);
    const deliveryCodeHash = this.cryptoService.sha256(deliveryCode);

    return this.prisma.$transaction(async (tx) => {
      const allApproved = await tx.donationClaim.findMany({
        where: {
          donationId: claim.donationId,
          status: { in: [ClaimStatus.APPROVED, ClaimStatus.COMPLETED] },
        },
        select: { approvedQuantity: true },
      });

      const totalApprovedSoFar = allApproved.reduce(
        (sum, c) => sum + Number(c.approvedQuantity ?? 0),
        0,
      );
      const remainingBeforeApproval =
        Number(claim.donation.totalQuantity) - totalApprovedSoFar;

      if (approvedQuantity > remainingBeforeApproval) {
        throw new ConflictException(
          `Approved allocation (${approvedQuantity}) exceeds remaining surplus food (${remainingBeforeApproval})`,
        );
      }

      const updatedClaim = await tx.donationClaim.update({
        where: { id: claimId },
        data: {
          status: ClaimStatus.APPROVED,
          approvedQuantity,
          reviewedAt: new Date(),
          reviewedById: actor.id,
        },
      });

      const remainingAfterApproval = remainingBeforeApproval - approvedQuantity;
      if (remainingAfterApproval <= 0) {
        await tx.donation.update({
          where: { id: claim.donationId },
          data: { status: DonationStatus.CLOSED },
        });
      }

      const delivery = await tx.delivery.create({
        data: {
          donationClaimId: claimId,
          status: DeliveryStatus.PENDING,
          pickupMode: claim.pickupMode,
          pickupCodeHash,
          deliveryCodeHash,
          pickupQrToken,
          deliveryQrToken,
          events: {
            create: {
              actorId: actor.id,
              eventType: 'DELIVERY_CREATED',
              description: `Delivery created for approved claim of ${approvedQuantity} ${claim.donation.unit} (${claim.pickupMode})`,
            },
          },
        },
      });

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.CLAIM_APPROVED,
          targetType: 'DonationClaim',
          targetId: claimId,
          organizationId: claim.donation.organizationId,
          metadata: {
            approvedQuantity,
            remainingAfterApproval,
            deliveryId: delivery.id,
            pickupMode: claim.pickupMode,
          },
        },
        tx,
      );

      return {
        ...updatedClaim,
        delivery: {
          id: delivery.id,
          status: delivery.status,
          pickupMode: delivery.pickupMode,
          pickupCode,
          pickupQrToken,
          deliveryCode,
          deliveryQrToken,
        },
      };
    });
  }

  async rejectClaim(
    claimId: string,
    dto: RejectClaimDto,
    actor: AuthenticatedUser,
  ) {
    const claim = await this.prisma.donationClaim.findUnique({
      where: { id: claimId },
      include: { donation: true },
    });

    if (!claim) {
      throw new NotFoundException('Claim record not found');
    }

    if (claim.status !== ClaimStatus.PENDING) {
      throw new ConflictException(`Cannot reject claim with status "${claim.status}"`);
    }

    await this.assertOrgMembership(claim.donation.organizationId, actor, 'leader');

    const updated = await this.prisma.donationClaim.update({
      where: { id: claimId },
      data: {
        status: ClaimStatus.REJECTED,
        rejectionReason: dto.rejectionReason?.trim(),
        reviewedAt: new Date(),
        reviewedById: actor.id,
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.CLAIM_REJECTED,
      targetType: 'DonationClaim',
      targetId: claimId,
      organizationId: claim.donation.organizationId,
      metadata: { rejectionReason: dto.rejectionReason },
    });

    return updated;
  }

  async listClaimsForDonation(donationId: string, actor: AuthenticatedUser) {
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
    });
    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    await this.assertOrgMembership(donation.organizationId, actor);

    return this.prisma.donationClaim.findMany({
      where: { donationId },
      orderBy: { requestedAt: 'asc' },
      include: {
        ngo: {
          select: {
            id: true,
            name: true,
            phone: true,
            verificationStatus: true,
          },
        },
        delivery: {
          select: {
            id: true,
            status: true,
            volunteerId: true,
            pickupCodeHash: true,
            pickupQrToken: true,
            assignedAt: true,
            pickedUpAt: true,
            deliveredAt: true,
          },
        },
      },
    });
  }

  async listClaimsByNgo(ngoId: string, actor: AuthenticatedUser) {
    await this.assertOrgMembership(ngoId, actor);

    return this.prisma.donationClaim.findMany({
      where: { ngoId },
      orderBy: { requestedAt: 'desc' },
      include: {
        donation: {
          select: {
            id: true,
            foodName: true,
            category: true,
            foodType: true,
            totalQuantity: true,
            unit: true,
            collectionDeadline: true,
            pickupPoint: { select: { id: true, name: true, address: true } },
            organization: { select: { id: true, name: true, phone: true } },
          },
        },
        delivery: {
          select: {
            id: true,
            status: true,
            estimatedArrivalAt: true,
            currentLatitude: true,
            currentLongitude: true,
            deliveryQrToken: true,
            deliveryCodeHash: true,
          },
        },
      },
    });
  }

  async getClaimById(id: string, actor: AuthenticatedUser) {
    const claim = await this.prisma.donationClaim.findUnique({
      where: { id },
      include: {
        donation: {
          include: {
            pickupPoint: true,
            organization: { select: { id: true, name: true, phone: true } },
          },
        },
        ngo: { select: { id: true, name: true, phone: true } },
        delivery: {
          include: {
            volunteer: {
              include: {
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    return claim;
  }
}
