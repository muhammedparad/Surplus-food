import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { ReviewTargetType } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateReviewDto } from './dto/create-review.dto.js';
import type { QueryReviewsDto } from './dto/query-reviews.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createReview(dto: CreateReviewDto, actor: AuthenticatedUser) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be an integer between 1 and 5');
    }

    // 1. Verify target exists
    if (dto.targetType === ReviewTargetType.ORGANIZATION) {
      const org = await this.prisma.organization.findUnique({
        where: { id: dto.targetId },
      });
      if (!org) {
        throw new NotFoundException('Target organization not found');
      }
    } else if (dto.targetType === ReviewTargetType.VOLUNTEER) {
      const vol = await this.prisma.volunteerProfile.findUnique({
        where: { id: dto.targetId },
      });
      if (!vol) {
        throw new NotFoundException('Target volunteer profile not found');
      }
    } else if (dto.targetType === ReviewTargetType.DONATION) {
      const don = await this.prisma.donation.findUnique({
        where: { id: dto.targetId },
      });
      if (!don) {
        throw new NotFoundException('Target donation not found');
      }
    }

    // 2. If deliveryId is provided, verify delivery exists and user is eligible
    if (dto.deliveryId) {
      const delivery = await this.prisma.delivery.findUnique({
        where: { id: dto.deliveryId },
        include: {
          volunteer: true,
          donationClaim: {
            include: {
              donation: true,
              ngo: true,
            },
          },
        },
      });

      if (!delivery) {
        throw new NotFoundException('Associated delivery record not found');
      }

      const isVolunteer = delivery.volunteer?.userId === actor.id;
      let isOrgMember = false;

      if (!isVolunteer) {
        const memberships = await this.prisma.organizationMember.findMany({
          where: {
            userId: actor.id,
            status: 'ACTIVE',
            organizationId: {
              in: [
                delivery.donationClaim.donation.organizationId,
                delivery.donationClaim.ngoId,
              ],
            },
          },
        });
        isOrgMember = memberships.length > 0;
      }

      if (!isVolunteer && !isOrgMember) {
        throw new ForbiddenException(
          'You can only review deliveries that your organization or volunteer profile participated in',
        );
      }
    }

    const review = await this.prisma.review.create({
      data: {
        authorId: actor.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        deliveryId: dto.deliveryId,
        rating: dto.rating,
        comment: dto.comment?.trim(),
        aspects: dto.aspects ? (dto.aspects as any) : undefined,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.USER_PROFILE_UPDATED,
      targetType: 'Review',
      targetId: review.id,
      metadata: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        rating: dto.rating,
      },
    });

    return review;
  }

  async getTargetReviews(
    targetType: ReviewTargetType,
    targetId: string,
    query: QueryReviewsDto,
  ) {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    const skip = (page - 1) * limit;

    const where = { targetType, targetId };

    const [total, reviews, allRatings] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
        },
      }),
      this.prisma.review.findMany({
        where,
        select: { rating: true },
      }),
    ]);

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of allRatings) {
      breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1;
      sum += r.rating;
    }

    const averageRating =
      allRatings.length > 0
        ? Math.round((sum / allRatings.length) * 10) / 10
        : 0;

    return {
      items: reviews,
      aggregate: {
        averageRating,
        totalReviews: total,
        ratingBreakdown: breakdown,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
