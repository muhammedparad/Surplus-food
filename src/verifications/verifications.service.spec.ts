import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerificationStatus } from '../generated/prisma/enums.js';
import { VerificationsService } from './verifications.service.js';

describe('VerificationsService', () => {
  let service: VerificationsService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockAuthLookup: any;

  const mockActor: any = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'user@example.com',
    name: 'Test User',
    globalRoles: [],
    globalPermissions: [],
  };

  beforeEach(() => {
    mockPrisma = {
      organization: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      volunteerProfile: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      verificationRequest: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    };

    mockAudit = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    mockAuthLookup = {
      getGlobalRolesAndPermissions: vi.fn().mockResolvedValue({
        roleSlugs: ['customer'],
        permissionKeys: ['verification:submit'],
      }),
    };

    service = new VerificationsService(mockPrisma, mockAudit, mockAuthLookup);
  });

  it('rejects submission if neither organizationId nor volunteerProfileId is specified', async () => {
    await expect(
      service.submitVerification(
        {
          documents: [{ documentType: 'LICENSE', fileUrl: 'https://example.com/doc.pdf' }],
        },
        mockActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects submission if both organizationId and volunteerProfileId are specified', async () => {
    await expect(
      service.submitVerification(
        {
          organizationId: '22222222-2222-2222-2222-222222222222',
          volunteerProfileId: '33333333-3333-3333-3333-333333333333',
          documents: [{ documentType: 'LICENSE', fileUrl: 'https://example.com/doc.pdf' }],
        },
        mockActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a pending verification request for an authorized organization owner', async () => {
    const orgId = '22222222-2222-2222-2222-222222222222';
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: orgId,
      name: 'Bistro Green',
      members: [
        {
          userId: mockActor.id,
          roles: [{ role: { slug: 'org_owner' } }],
        },
      ],
    });
    mockPrisma.verificationRequest.findFirst.mockResolvedValue(null);
    mockPrisma.verificationRequest.create.mockResolvedValue({
      id: 'req-1',
      organizationId: orgId,
      status: VerificationStatus.PENDING,
      documents: [{ documentType: 'LICENSE', fileUrl: 'https://example.com/doc.pdf' }],
    });

    const result = await service.submitVerification(
      {
        organizationId: orgId,
        documents: [{ documentType: 'LICENSE', fileUrl: 'https://example.com/doc.pdf' }],
      },
      mockActor,
    );

    expect(result.id).toBe('req-1');
    expect(mockPrisma.verificationRequest.create).toHaveBeenCalled();
    expect(mockAudit.record).toHaveBeenCalled();
  });

  it('blocks duplicate pending verification requests for the same organization', async () => {
    const orgId = '22222222-2222-2222-2222-222222222222';
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: orgId,
      name: 'Bistro Green',
      members: [
        {
          userId: mockActor.id,
          roles: [{ role: { slug: 'org_owner' } }],
        },
      ],
    });
    mockPrisma.verificationRequest.findFirst.mockResolvedValue({
      id: 'existing-pending-req',
      status: VerificationStatus.PENDING,
    });

    await expect(
      service.submitVerification(
        {
          organizationId: orgId,
          documents: [{ documentType: 'LICENSE', fileUrl: 'https://example.com/doc.pdf' }],
        },
        mockActor,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('approves verification and updates target organization status to VERIFIED', async () => {
    const reqId = 'req-1';
    const orgId = 'org-1';

    mockPrisma.verificationRequest.findUnique.mockResolvedValue({
      id: reqId,
      organizationId: orgId,
      status: VerificationStatus.PENDING,
    });
    mockPrisma.verificationRequest.update.mockResolvedValue({
      id: reqId,
      status: VerificationStatus.VERIFIED,
    });

    const result = await service.reviewVerification(
      reqId,
      { status: VerificationStatus.VERIFIED },
      mockActor,
    );

    expect(result.status).toBe(VerificationStatus.VERIFIED);
    expect(mockPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: orgId },
      data: { verificationStatus: VerificationStatus.VERIFIED },
    });
  });

  it('requires a rejectionReason when declining verification', async () => {
    await expect(
      service.reviewVerification(
        'req-1',
        { status: VerificationStatus.REJECTED },
        mockActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
