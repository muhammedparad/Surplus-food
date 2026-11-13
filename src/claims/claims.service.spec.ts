import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ClaimStatus,
  DonationStatus,
  OrganizationType,
  VerificationStatus,
} from '../generated/prisma/enums.js';
import { ClaimsService } from './claims.service.js';

describe('ClaimsService', () => {
  let service: ClaimsService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockCrypto: any;
  let mockAuthLookup: any;

  const mockActor: any = {
    id: 'user-1',
    email: 'ngo@example.com',
    name: 'NGO Rep',
  };

  beforeEach(() => {
    mockPrisma = {
      organization: {
        findUnique: vi.fn(),
      },
      organizationMember: {
        findUnique: vi.fn(),
      },
      donation: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      donationClaim: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      delivery: {
        create: vi.fn().mockImplementation((args) =>
          Promise.resolve({
            id: 'del-1',
            status: 'PENDING',
            pickupMode: args.data.pickupMode ?? 'VOLUNTEER',
          }),
        ),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    };

    mockAudit = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    mockCrypto = {
      sha256: vi.fn((val) => `hash_${val}`),
    };

    mockAuthLookup = {
      getGlobalRolesAndPermissions: vi.fn().mockResolvedValue({
        roleSlugs: ['customer'],
        permissionKeys: ['claim:create', 'claim:review'],
      }),
    };

    service = new ClaimsService(mockPrisma, mockAudit, mockCrypto, mockAuthLookup);
  });

  it('rejects claim submission if claiming organization is not verified', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [{ role: { slug: 'org_owner' } }],
    });

    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ngo-1',
      type: OrganizationType.NGO,
      verificationStatus: VerificationStatus.PENDING, // Not VERIFIED!
    });

    await expect(
      service.submitClaim(
        'don-1',
        { ngoId: 'ngo-1', requestedQuantity: 20 },
        mockActor,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects claim submission if requested quantity exceeds available remaining quantity', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [{ role: { slug: 'org_owner' } }],
    });

    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ngo-1',
      type: OrganizationType.NGO,
      verificationStatus: VerificationStatus.VERIFIED,
    });

    mockPrisma.donation.findUnique.mockResolvedValue({
      id: 'don-1',
      totalQuantity: 50,
      status: DonationStatus.AVAILABLE,
      collectionDeadline: new Date(Date.now() + 3600000),
      claims: [{ approvedQuantity: 40 }], // 10 remaining
    });

    await expect(
      service.submitClaim(
        'don-1',
        { ngoId: 'ngo-1', requestedQuantity: 25 }, // Asking for 25 when only 10 left
        mockActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('submits a pending claim successfully when valid', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [{ role: { slug: 'org_owner' } }],
    });

    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ngo-1',
      type: OrganizationType.NGO,
      verificationStatus: VerificationStatus.VERIFIED,
    });

    mockPrisma.donation.findUnique.mockResolvedValue({
      id: 'don-1',
      totalQuantity: 50,
      status: DonationStatus.AVAILABLE,
      collectionDeadline: new Date(Date.now() + 3600000),
      claims: [{ approvedQuantity: 20 }], // 30 remaining
    });

    mockPrisma.donationClaim.findFirst.mockResolvedValue(null);
    mockPrisma.donationClaim.create.mockResolvedValue({
      id: 'claim-1',
      donationId: 'don-1',
      ngoId: 'ngo-1',
      requestedQuantity: 20,
      status: ClaimStatus.PENDING,
    });

    const result = await service.submitClaim(
      'don-1',
      { ngoId: 'ngo-1', requestedQuantity: 20 },
      mockActor,
    );

    expect(result.id).toBe('claim-1');
    expect(result.status).toBe(ClaimStatus.PENDING);
  });

  it('approves claim, creates delivery, and generates security codes', async () => {
    mockPrisma.donationClaim.findUnique.mockResolvedValue({
      id: 'claim-1',
      donationId: 'don-1',
      requestedQuantity: 30,
      pickupMode: 'VOLUNTEER',
      status: ClaimStatus.PENDING,
      donation: {
        id: 'don-1',
        organizationId: 'rest-1',
        totalQuantity: 50,
        unit: 'MEALS',
      },
    });

    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [{ role: { slug: 'org_owner' } }],
    });

    mockPrisma.donationClaim.findMany.mockResolvedValue([]); // 0 approved claims so far
    mockPrisma.donationClaim.update.mockResolvedValue({
      id: 'claim-1',
      status: ClaimStatus.APPROVED,
      approvedQuantity: 30,
    });

    const result = await service.approveClaim('claim-1', { approvedQuantity: 30 }, mockActor);

    expect(result.status).toBe(ClaimStatus.APPROVED);
    expect(result.delivery).toBeDefined();
    expect(result.delivery.pickupCode).toHaveLength(6);
    expect(result.delivery.deliveryCode).toHaveLength(6);
    expect(result.delivery.pickupQrToken).toBeDefined();
    expect(result.delivery.deliveryQrToken).toBeDefined();
    expect(mockPrisma.delivery.create).toHaveBeenCalled();
  });

  it('rejects claim approval if approved quantity exceeds remaining available food', async () => {
    mockPrisma.donationClaim.findUnique.mockResolvedValue({
      id: 'claim-1',
      donationId: 'don-1',
      requestedQuantity: 40,
      status: ClaimStatus.PENDING,
      donation: {
        id: 'don-1',
        organizationId: 'rest-1',
        totalQuantity: 50,
        unit: 'MEALS',
      },
    });

    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [{ role: { slug: 'org_owner' } }],
    });

    // Another claim already took 30, so only 20 remaining!
    mockPrisma.donationClaim.findMany.mockResolvedValue([{ approvedQuantity: 30 }]);

    await expect(
      service.approveClaim('claim-1', { approvedQuantity: 40 }, mockActor),
    ).rejects.toThrow(ConflictException);
  });
});
