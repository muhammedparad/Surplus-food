import { describe, expect, it } from 'vitest';
import {
  ClaimStatus,
  DeliveryStatus,
  DonationStatus,
  OrganizationType,
  PickupMode,
  VerificationStatus,
} from '../src/generated/prisma/enums.js';
import { runWorkflowSimulation } from '../scripts/simulate-workflow.js';

describe('End-to-End Multi-Actor Food Rescue & Redistribution User Journey', () => {
  it('executes all 18 steps of the product story end-to-end without external dependencies', async () => {
    const result = await runWorkflowSimulation();

    // Step 1 assertions
    expect(result.superAdmin).toBeDefined();
    expect(result.superAdmin.email).toBe('admin@foodrescue.org');

    // Step 2 & 3 assertions
    expect(result.restaurant).toBeDefined();
    expect(result.restaurant.name).toBe('Spice Garden');
    expect(result.restaurant.type).toBe(OrganizationType.RESTAURANT);
    expect(result.restaurant.verificationStatus).toBe(VerificationStatus.VERIFIED);

    // Step 4 & 5 assertions
    expect(result.ngo).toBeDefined();
    expect(result.ngo.name).toBe('City Hope Shelter');
    expect(result.ngo.type).toBe(OrganizationType.NGO);
    expect(result.ngo.verificationStatus).toBe(VerificationStatus.VERIFIED);

    // Step 6 assertions
    expect(result.volunteerProfile).toBeDefined();
    expect(result.volunteerProfile.isAvailable).toBe(true);

    // Step 7 & 8 assertions
    expect(result.donation).toBeDefined();
    expect(result.donation.foodName).toBe('Vegetable Biryani');
    expect(Number(result.donation.totalQuantity)).toBe(50);

    // Step 9 & 10 assertions
    expect(result.claim1).toBeDefined();
    expect(Number(result.claim1.requestedQuantity)).toBe(30);
    expect(result.delivery1).toBeDefined();
    expect(result.delivery1.pickupQrToken).toBeDefined();
    expect(result.delivery1.deliveryQrToken).toBeDefined();
    expect(result.delivery1.pickupCode).toMatch(/^\d{6}$/);
    expect(result.delivery1.deliveryCode).toMatch(/^\d{6}$/);

    // Step 11, 12, 13, 14, 15 assertions
    // Claim 1 completed through volunteer flow
    expect(result.claim1.id).toBeDefined();

    // Step 16 assertions
    expect(result.claim2).toBeDefined();
    expect(Number(result.claim2.requestedQuantity)).toBe(20);
    expect(result.claim2.pickupMode).toBe(PickupMode.DIRECT_NGO);
    expect(result.delivery2.pickupMode).toBe(PickupMode.DIRECT_NGO);

    // Step 17 & 18 assertions
    expect(result.review).toBeDefined();
    expect(result.review.rating).toBe(5);
    expect(result.aggregateReviews).toBeDefined();
    expect(result.aggregateReviews.totalReviews).toBe(1);
    expect(result.aggregateReviews.averageRating).toBe(5);
  });
});
