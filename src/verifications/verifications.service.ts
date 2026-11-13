import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import { VerificationStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { QueryVerificationsDto } from './dto/query-verifications.dto.js';
import type { ReviewVerificationDto } from './dto/review-verification.dto.js';
import type { SubmitVerificationDto } from './dto/submit-verification.dto.js';

@Injectable()
export class VerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly authLookup: AuthorizationLookupService,
  ) {}

  async submitVerification(dto: SubmitVerificationDto, actor: AuthenticatedUser) {
    const hasOrg = Boolean(dto.organizationId);
    const hasVol = Boolean(dto.volunteerProfileId);

    if ((hasOrg && hasVol) || (!hasOrg && !hasVol)) {
      throw new BadRequestException(
        'Exactly one target must be provided: either organizationId or volunteerProfileId',
      );
    }

    const { roleSlugs: globalRoles } =
      await this.authLookup.getGlobalRolesAndPermissions(actor.id);
    const isSuperAdmin = globalRoles.includes('super_admin');

    if (dto.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
        include: {
          members: {
            where: { userId: actor.id },
            include: { roles: { include: { role: true } } },
          },
        },
      });

      if (!org) {
        throw new NotFoundException('Target organization does not exist');
      }

      const membership = org.members[0];
      const isOrgLeader = membership?.roles.some((r) =>
        ['org_owner', 'org_admin'].includes(r.role.slug),
      );

      if (!isSuperAdmin && !isOrgLeader) {
        throw new ForbiddenException(
          'Only organization owners or administrators can submit verification documents',
        );
      }

      const pendingExisting = await this.prisma.verificationRequest.findFirst({
        where: {
          organizationId: dto.organizationId,
          status: VerificationStatus.PENDING,
        },
      });

      if (pendingExisting) {
        throw new ConflictException(
          'A pending verification request for this organization is already under review',
        );
      }
    }

    if (dto.volunteerProfileId) {
      const profile = await this.prisma.volunteerProfile.findUnique({
        where: { id: dto.volunteerProfileId },
      });

      if (!profile) {
        throw new NotFoundException('Volunteer profile does not exist');
      }

      if (!isSuperAdmin && profile.userId !== actor.id) {
        throw new ForbiddenException(
          'You may only submit verification documents for your own volunteer profile',
        );
      }

      const pendingExisting = await this.prisma.verificationRequest.findFirst({
        where: {
          volunteerProfileId: dto.volunteerProfileId,
          status: VerificationStatus.PENDING,
        },
      });

      if (pendingExisting) {
        throw new ConflictException(
          'A pending verification request for this volunteer profile is already under review',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.verificationRequest.create({
        data: {
          organizationId: dto.organizationId,
          volunteerProfileId: dto.volunteerProfileId,
          submittedById: actor.id,
          status: VerificationStatus.PENDING,
          documents: {
            create: dto.documents.map((doc) => ({
              documentType: doc.documentType.trim(),
              fileUrl: doc.fileUrl.trim(),
            })),
          },
        },
        include: {
          documents: true,
          organization: { select: { id: true, name: true, type: true } },
          volunteerProfile: { select: { id: true, userId: true, transportType: true } },
        },
      });

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.VERIFICATION_SUBMITTED,
          targetType: 'VerificationRequest',
          targetId: request.id,
          organizationId: dto.organizationId,
          metadata: {
            organizationId: dto.organizationId,
            volunteerProfileId: dto.volunteerProfileId,
            documentCount: dto.documents.length,
          },
        },
        tx,
      );

      return request;
    });
  }

  async listVerifications(query: QueryVerificationsDto): Promise<PaginatedResult<any>> {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    const skip = (page - 1) * limit;

    const where = {
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.verificationRequest.count({ where }),
      this.prisma.verificationRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          documents: true,
          submittedBy: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true, email: true } },
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              registrationNumber: true,
              registeredAddress: true,
              verificationStatus: true,
            },
          },
          volunteerProfile: {
            select: {
              id: true,
              userId: true,
              transportType: true,
              verificationStatus: true,
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
        },
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

  async getVerificationById(id: string, actor: AuthenticatedUser) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id },
      include: {
        documents: true,
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        organization: true,
        volunteerProfile: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    const { roleSlugs, permissionKeys } =
      await this.authLookup.getGlobalRolesAndPermissions(actor.id);
    const isPrivileged =
      roleSlugs.includes('super_admin') ||
      roleSlugs.includes('admin') ||
      permissionKeys.includes('verification:read');

    const isOwner = request.submittedById === actor.id;

    if (!isPrivileged && !isOwner) {
      throw new ForbiddenException('Not authorized to inspect this verification record');
    }

    return request;
  }

  async reviewVerification(
    id: string,
    dto: ReviewVerificationDto,
    actor: AuthenticatedUser,
  ) {
    if (
      dto.status !== VerificationStatus.VERIFIED &&
      dto.status !== VerificationStatus.REJECTED
    ) {
      throw new BadRequestException('Status must be either VERIFIED or REJECTED');
    }

    if (dto.status === VerificationStatus.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('A rejection reason is mandatory when declining verification');
    }

    const request = await this.prisma.verificationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    if (request.status !== VerificationStatus.PENDING) {
      throw new ConflictException(`Verification request is already finalized as ${request.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.verificationRequest.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedById: actor.id,
          reviewedAt: new Date(),
          rejectionReason:
            dto.status === VerificationStatus.REJECTED ? dto.rejectionReason?.trim() : null,
        },
        include: {
          documents: true,
          organization: true,
          volunteerProfile: true,
        },
      });

      if (request.organizationId) {
        await tx.organization.update({
          where: { id: request.organizationId },
          data: { verificationStatus: dto.status },
        });
      }

      if (request.volunteerProfileId) {
        await tx.volunteerProfile.update({
          where: { id: request.volunteerProfileId },
          data: { verificationStatus: dto.status },
        });
      }

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.VERIFICATION_REVIEWED,
          targetType: 'VerificationRequest',
          targetId: id,
          organizationId: request.organizationId ?? undefined,
          metadata: {
            decision: dto.status,
            rejectionReason: dto.rejectionReason,
            organizationId: request.organizationId,
            volunteerProfileId: request.volunteerProfileId,
          },
        },
        tx,
      );

      return updatedRequest;
    });
  }
}
