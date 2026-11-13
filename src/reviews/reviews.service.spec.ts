import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewTargetType } from '../generated/prisma/enums.js';
import { ReviewsService } from './reviews.service.js';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockActor: any = {
    id: 'user-author-1',
    name: 'Sarah Reviewer',
  };

  beforeEach(() => {
    mockPrisma = {
      organization: {
        findUnique: vi.fn(),
      },
      volunteerProfile: {
        findUnique: vi.fn(),
      },
      donation: {
        findUnique: vi.fn(),
      },
      delivery: {
        findUnique: vi.fn(),
      },
      organizationMember: {
        findMany: vi.fn(),
      },
      review: {
        create: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
    };

    mockAudit = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    service = new ReviewsService(mockPrisma, mockAudit);
  });

  it('rejects ratings outside 1-5 range', async () => {
    await expect(
      service.createReview(
        {
          targetType: ReviewTargetType.ORGANIZATION,
          targetId: 'org-1',
          rating: 6, // Invalid rating!
        },
        mockActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects review if target organization does not exist', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    await expect(
      service.createReview(
        {
          targetType: ReviewTargetType.ORGANIZATION,
          targetId: 'org-missing',
          rating: 5,
        },
        mockActor,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('successfully creates review and records audit event', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-1', name: 'Green Bistro' });
    mockPrisma.review.create.mockResolvedValue({
      id: 'rev-1',
      authorId: mockActor.id,
      targetType: ReviewTargetType.ORGANIZATION,
      targetId: 'org-1',
      rating: 5,
      comment: 'Excellent food hygiene!',
      author: { id: mockActor.id, name: mockActor.name },
    });

    const result = await service.createReview(
      {
        targetType: ReviewTargetType.ORGANIZATION,
        targetId: 'org-1',
        rating: 5,
        comment: 'Excellent food hygiene!',
      },
      mockActor,
    );

    expect(result.id).toBe('rev-1');
    expect(result.rating).toBe(5);
    expect(mockPrisma.review.create).toHaveBeenCalled();
    expect(mockAudit.record).toHaveBeenCalled();
  });

  it('calculates average rating and star breakdown correctly for target entity', async () => {
    mockPrisma.review.count.mockResolvedValue(4);
    mockPrisma.review.findMany
      .mockResolvedValueOnce([
        { id: 'rev-1', rating: 5, author: { name: 'Sarah' } },
        { id: 'rev-2', rating: 4, author: { name: 'Alex' } },
      ])
      .mockResolvedValueOnce([
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 2 },
      ]);

    const result = await service.getTargetReviews(
      ReviewTargetType.VOLUNTEER,
      'vol-1',
      { page: 1, limit: 10 },
    );

    expect(result.aggregate.totalReviews).toBe(4);
    // (5+5+4+2) / 4 = 16 / 4 = 4.0
    expect(result.aggregate.averageRating).toBe(4);
    expect(result.aggregate.ratingBreakdown[5]).toBe(2);
    expect(result.aggregate.ratingBreakdown[4]).toBe(1);
    expect(result.aggregate.ratingBreakdown[2]).toBe(1);
  });
});
