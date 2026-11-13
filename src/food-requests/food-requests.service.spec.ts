import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FoodCategory,
  FoodRequestStatus,
  FoodType,
  FoodUnit,
  FulfillmentStatus,
  OrganizationType,
  VerificationStatus,
} from '../generated/prisma/enums.js';
import { FoodRequestsService } from './food-requests.service.js';

describe('FoodRequestsService', () => {
  let service: FoodRequestsService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockCrypto: any;
  let mockAuthLookup: any;

  const mockActor: any = {
    id: 'user-ngo-leader',
    email: 'leader@ngo.org',
    name: 'Shelter Director',
  };

  beforeEach(() => {
    mockPrisma = {
      organization: {
        findUnique: vi.fn(),
      },
      organizationMember: {
        findUnique: vi.fn(),
      },
      deliveryLocation: {
        findFirst: vi.fn(),
      },
      ngoFoodRequest: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      ngoRequestFulfillment: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      donation: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      donationClaim: {
        create: vi.fn(),
      },
      delivery: {
        create: vi.fn().mockResolvedValue({ id: 'del-task-1', status: 'PENDING' }),
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
        permissionKeys: ['food_request:create', 'food_request:update'],
      }),
    };

    service = new FoodRequestsService(
      mockPrisma,
      mockAudit,
      mockCrypto,
      mockAuthLookup,
    );
  });

  it('rejects advance food request if NGO is unverified', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [{ role: { slug: 'org_owner' } }],
    });

    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ngo-1',
      type: OrganizationType.NGO,
      verificationStatus: VerificationStatus.PENDING, // Not verified!
    });

    await expect(
      service.createRequest(
        {
          ngoId: 'ngo-1',
          foodCategory: FoodCategory.MEALS,
          foodType: FoodType.VEG,
          requiredQuantity: 100,
          unit: FoodUnit.MEALS,
          requiredDate: '2026-11-20',
          requiredBefore: '2026-11-20T18:00:00Z',
          deliveryLocationId: 'loc-1',
        },
        mockActor,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('creates an open food request for a verified NGO leader', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [{ role: { slug: 'org_owner' } }],
    });

    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ngo-1',
      type: OrganizationType.NGO,
      verificationStatus: VerificationStatus.VERIFIED,
    });

    mockPrisma.deliveryLocation.findFirst.mockResolvedValue({
      id: 'loc-1',
      organizationId: 'ngo-1',
      isActive: true,
    });

    mockPrisma.ngoFoodRequest.create.mockResolvedValue({
      id: 'req-1',
      status: FoodRequestStatus.OPEN,
      requiredQuantity: 100,
    });

    const result = await service.createRequest(
      {
        ngoId: 'ngo-1',
        foodCategory: FoodCategory.MEALS,
        foodType: FoodType.VEG,
        requiredQuantity: 100,
        unit: FoodUnit.MEALS,
        requiredDate: '2026-11-20',
        requiredBefore: '2026-11-20T18:00:00Z',
        deliveryLocationId: 'loc-1',
      },
      mockActor,
    );

    expect(result.id).toBe('req-1');
    expect(result.status).toBe(FoodRequestStatus.OPEN);
  });

  it('proposes fulfillment from an available donation', async () => {
    mockPrisma.ngoFoodRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      status: FoodRequestStatus.OPEN,
      requiredQuantity: 100,
      fulfillments: [],
    });

    mockPrisma.donation.findUnique.mockResolvedValue({
      id: 'don-1',
      organizationId: 'rest-1',
      status: 'AVAILABLE',
      totalQuantity: 80,
      claims: [],
    });

    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [{ role: { slug: 'org_owner' } }],
    });

    mockPrisma.ngoRequestFulfillment.create.mockResolvedValue({
      id: 'ful-1',
      requestId: 'req-1',
      donationId: 'don-1',
      allocatedQuantity: 50,
      status: FulfillmentStatus.PROPOSED,
    });

    const result = await service.proposeFulfillment(
      'req-1',
      { donationId: 'don-1', allocatedQuantity: 50 },
      mockActor,
    );

    expect(result.id).toBe('ful-1');
    expect(result.status).toBe(FulfillmentStatus.PROPOSED);
  });

  it('accepts proposed fulfillment, creates claim & delivery, and updates request status', async () => {
    mockPrisma.ngoRequestFulfillment.findUnique.mockResolvedValue({
      id: 'ful-1',
      requestId: 'req-1',
      donationId: 'don-1',
      allocatedQuantity: 50,
      status: FulfillmentStatus.PROPOSED,
      request: {
        id: 'req-1',
        ngoId: 'ngo-1',
        requiredQuantity: 50,
      },
      donation: {
        id: 'don-1',
        unit: 'MEALS',
      },
    });

    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [{ role: { slug: 'org_owner' } }],
    });

    mockPrisma.donationClaim.create.mockResolvedValue({
      id: 'claim-1',
      status: 'APPROVED',
      approvedQuantity: 50,
    });

    mockPrisma.ngoRequestFulfillment.update.mockResolvedValue({
      id: 'ful-1',
      status: FulfillmentStatus.ACCEPTED,
    });

    mockPrisma.ngoRequestFulfillment.findMany.mockResolvedValue([
      { allocatedQuantity: 50 },
    ]);

    mockPrisma.ngoFoodRequest.update.mockResolvedValue({
      id: 'req-1',
      status: FoodRequestStatus.FULFILLED,
    });

    const result = await service.acceptFulfillment('ful-1', mockActor);

    expect(result.status).toBe(FulfillmentStatus.ACCEPTED);
    expect(result.delivery).toBeDefined();
    expect(result.delivery.pickupCode).toHaveLength(6);
    expect(result.delivery.deliveryCode).toHaveLength(6);
    expect(mockPrisma.donationClaim.create).toHaveBeenCalled();
    expect(mockPrisma.ngoFoodRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: { status: FoodRequestStatus.FULFILLED },
    });
  });
});
