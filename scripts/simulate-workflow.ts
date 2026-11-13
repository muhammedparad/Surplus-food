/* eslint-disable */
// @ts-nocheck
import 'reflect-metadata';
import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../src/audit/audit.service.js';
import type { AuthenticatedUser } from '../src/common/interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../src/common/services/authorization-lookup.service.js';
import { CryptoService } from '../src/common/services/crypto.service.js';
import { PolicyRegistryService } from '../src/common/services/policy-registry.service.js';
import { EmailService } from '../src/email/email.service.js';
import {
  ClaimStatus,
  DeliveryStatus,
  DonationStatus,
  FoodCategory,
  FoodType,
  FoodUnit,
  MembershipStatus,
  OrganizationType,
  PickupMode,
  ReviewTargetType,
  RoleScope,
  StorageType,
  TransportType,
  UserStatus,
  VerificationStatus,
} from '../src/generated/prisma/enums.js';
import { LocationsService } from '../src/locations/locations.service.js';
import { OrganizationResourcePolicy } from '../src/organizations/organization.policy.js';
import { OrganizationsService } from '../src/organizations/organizations.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { VerificationsService } from '../src/verifications/verifications.service.js';
import { VolunteersService } from '../src/volunteers/volunteers.service.js';
import { DonationsService } from '../src/donations/donations.service.js';
import { ClaimsService } from '../src/claims/claims.service.js';
import { DeliveriesService } from '../src/deliveries/deliveries.service.js';
import { ReviewsService } from '../src/reviews/reviews.service.js';
import { InMemoryPrismaStore, seedInMemoryDatabase } from '../test/mocks/in-memory-prisma.js';

export interface WorkflowSimulationResult {
  superAdmin: any;
  restaurant: any;
  restaurantOwner: any;
  ngo: any;
  ngoDirector: any;
  volunteer: any;
  volunteerProfile: any;
  donation: any;
  claim1: any;
  delivery1: any;
  claim2: any;
  delivery2: any;
  review: any;
  aggregateReviews: any;
}

export async function runWorkflowSimulation(
  existingPrisma?: InMemoryPrismaStore,
): Promise<WorkflowSimulationResult> {
  console.log('\n================================================================');
  console.log('   FOOD RESCUE & REDISTRIBUTION PLATFORM - E2E SIMULATION       ');
  console.log('================================================================\n');

  const prisma = existingPrisma ?? new InMemoryPrismaStore();
  await seedInMemoryDatabase(prisma);

  const configService = new ConfigService({
    auth: {
      enableOrganizations: true,
      defaultUserRole: 'customer',
      invitationExpiresIn: '7d',
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true,
      },
    },
  });

  const cryptoService = new CryptoService();
  const auditService = new AuditService(prisma as any);
  const authLookup = new AuthorizationLookupService(prisma as any);
  const policyRegistry = new PolicyRegistryService();
  const organizationPolicy = new OrganizationResourcePolicy();
  const emailService = {
    sendEmail: async () => {},
    sendOrganizationInvitation: async () => {},
    sendVerificationEmail: async () => {},
  } as unknown as EmailService;

  const organizationsService = new OrganizationsService(
    prisma as any,
    cryptoService,
    emailService,
    auditService,
    authLookup,
    policyRegistry,
    organizationPolicy,
    configService,
  );
  organizationsService.onModuleInit();

  const locationsService = new LocationsService(prisma as any, authLookup);
  const verificationsService = new VerificationsService(prisma as any, auditService, authLookup);
  const volunteersService = new VolunteersService(prisma as any);
  const donationsService = new DonationsService(prisma as any, auditService, authLookup);
  const claimsService = new ClaimsService(prisma as any, auditService, cryptoService, authLookup);
  const deliveriesService = new DeliveriesService(prisma as any, auditService, cryptoService, authLookup);
  const reviewsService = new ReviewsService(prisma as any, auditService);

  // -------------------------------------------------------------------------
  // STEP 1: Bootstrap initial superadmin user
  // -------------------------------------------------------------------------
  const superAdminPasswordHash = await cryptoService.hashPassword('SuperSecureAdmin#2026');
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'admin@foodrescue.org',
      name: 'Super Administrator',
      passwordHash: superAdminPasswordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  const superAdminRole = await prisma.role.findFirst({
    where: { scope: RoleScope.GLOBAL, slug: 'super_admin' },
  });

  await prisma.userRole.create({
    data: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });

  const superAdminActor: AuthenticatedUser = {
    id: superAdminUser.id,
    email: superAdminUser.email,
    name: superAdminUser.name,
    status: UserStatus.ACTIVE,
    roles: ['super_admin'],
    permissions: ['*'],
  };

  console.log(
    `[✓] STEP 1: Bootstrapped Superadmin user "${superAdminUser.name}" (${superAdminUser.email}) with GLOBAL super_admin role.`,
  );

  // -------------------------------------------------------------------------
  // STEP 2: Restaurant ("Spice Garden") registers & submits food safety verification
  // -------------------------------------------------------------------------
  const chefPasswordHash = await cryptoService.hashPassword('ChefSpicePass#2026');
  const chefUser = await prisma.user.create({
    data: {
      email: 'chef@spicegarden.com',
      name: 'Chef Rahul',
      passwordHash: chefPasswordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  const customerRole = await prisma.role.findFirst({
    where: { scope: RoleScope.GLOBAL, slug: 'customer' },
  });

  await prisma.userRole.create({
    data: {
      userId: chefUser.id,
      roleId: customerRole.id,
    },
  });

  const chefActorPreOrg: AuthenticatedUser = {
    id: chefUser.id,
    email: chefUser.email,
    name: chefUser.name,
    status: UserStatus.ACTIVE,
    roles: ['customer'],
    permissions: [],
  };

  const spiceGardenOrg = await organizationsService.createOrganization(
    {
      name: 'Spice Garden',
      slug: 'spice-garden',
      type: OrganizationType.RESTAURANT,
      registrationNumber: 'FSSAI-9876543210',
      registeredAddress: '12 Spice Street, Food District, Bangalore',
      email: 'contact@spicegarden.com',
      phone: '+91-9876543210',
      latitude: 12.9716,
      longitude: 77.5946,
    },
    chefActorPreOrg,
  );

  const restaurantActor: AuthenticatedUser = {
    ...chefActorPreOrg,
    activeOrganizationId: spiceGardenOrg.id,
  };

  const restaurantPickupPoint = await locationsService.createPickupPoint(
    {
      organizationId: spiceGardenOrg.id,
      name: 'Spice Garden Main Kitchen Dispatch',
      address: '12 Spice Street, Back Entrance Bay 2',
      latitude: 12.9716,
      longitude: 77.5946,
      instructions: 'Ring kitchen dispatch bell at Bay 2 and ask for Chef Rahul.',
    },
    restaurantActor,
  );

  const restaurantVerification = await verificationsService.submitVerification(
    {
      organizationId: spiceGardenOrg.id,
      documents: [
        {
          documentType: 'FOOD_SAFETY_FSSAI',
          fileUrl: 'https://storage.foodrescue.org/docs/spicegarden_fssai_cert.pdf',
        },
        {
          documentType: 'HEALTH_INSPECTION_AUDIT',
          fileUrl: 'https://storage.foodrescue.org/docs/spicegarden_audit_pass.pdf',
        },
      ],
    },
    restaurantActor,
  );

  console.log(
    `[✓] STEP 2: Restaurant "Spice Garden" registered (Org ID: ${spiceGardenOrg.id}) and submitted 2 safety verification documents (Req ID: ${restaurantVerification.id}).`,
  );

  // -------------------------------------------------------------------------
  // STEP 3: Superadmin reviews & VERIFIES Restaurant
  // -------------------------------------------------------------------------
  const verifiedRestaurantReq = await verificationsService.reviewVerification(
    restaurantVerification.id,
    { status: VerificationStatus.VERIFIED },
    superAdminActor,
  );

  const refreshedRestaurant = await prisma.organization.findUnique({
    where: { id: spiceGardenOrg.id },
  });

  if (refreshedRestaurant.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new Error('Step 3 Failed: Restaurant verification status was not updated to VERIFIED');
  }

  console.log(
    `[✓] STEP 3: Superadmin reviewed & VERIFIED Restaurant "Spice Garden". Org status is now: ${refreshedRestaurant.verificationStatus}.`,
  );

  // -------------------------------------------------------------------------
  // STEP 4: NGO ("City Hope Shelter") registers & submits NGO verification documents
  // -------------------------------------------------------------------------
  const ngoLeaderPasswordHash = await cryptoService.hashPassword('SisterMaryPass#2026');
  const ngoLeaderUser = await prisma.user.create({
    data: {
      email: 'director@cityhope.org',
      name: 'Sister Mary',
      passwordHash: ngoLeaderPasswordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.userRole.create({
    data: {
      userId: ngoLeaderUser.id,
      roleId: customerRole.id,
    },
  });

  const ngoLeaderActorPreOrg: AuthenticatedUser = {
    id: ngoLeaderUser.id,
    email: ngoLeaderUser.email,
    name: ngoLeaderUser.name,
    status: UserStatus.ACTIVE,
    roles: ['customer'],
    permissions: [],
  };

  const cityHopeOrg = await organizationsService.createOrganization(
    {
      name: 'City Hope Shelter',
      slug: 'city-hope-shelter',
      type: OrganizationType.NGO,
      registrationNumber: 'NGO-REG-80G-445566',
      registeredAddress: '88 Charity Boulevard, Shelter Campus, Bangalore',
      email: 'helpline@cityhope.org',
      phone: '+91-9123456780',
      beneficiaryCount: 150,
      servingCapacity: 200,
      latitude: 12.978,
      longitude: 77.64,
    },
    ngoLeaderActorPreOrg,
  );

  const ngoActor: AuthenticatedUser = {
    ...ngoLeaderActorPreOrg,
    activeOrganizationId: cityHopeOrg.id,
  };

  const ngoDeliveryLocation = await locationsService.createDeliveryLocation(
    {
      organizationId: cityHopeOrg.id,
      name: 'City Hope Shelter Community Dining Hall',
      address: '88 Charity Boulevard, Community Gate A',
      latitude: 12.978,
      longitude: 77.64,
      instructions: 'Deliver directly to kitchen pantry; volunteer entrance open 24/7.',
    },
    ngoActor,
  );

  const ngoVerification = await verificationsService.submitVerification(
    {
      organizationId: cityHopeOrg.id,
      documents: [
        {
          documentType: 'NGO_REGISTRATION_80G',
          fileUrl: 'https://storage.foodrescue.org/docs/cityhope_80g_exemption.pdf',
        },
        {
          documentType: 'SHELTER_CAPACITY_AFFIDAVIT',
          fileUrl: 'https://storage.foodrescue.org/docs/cityhope_capacity_audit.pdf',
        },
      ],
    },
    ngoActor,
  );

  console.log(
    `[✓] STEP 4: NGO "City Hope Shelter" registered (Org ID: ${cityHopeOrg.id}, Capacity: 200 meals) and submitted verification documents (Req ID: ${ngoVerification.id}).`,
  );

  // -------------------------------------------------------------------------
  // STEP 5: Superadmin reviews & VERIFIES NGO
  // -------------------------------------------------------------------------
  await verificationsService.reviewVerification(
    ngoVerification.id,
    { status: VerificationStatus.VERIFIED },
    superAdminActor,
  );

  const refreshedNgo = await prisma.organization.findUnique({
    where: { id: cityHopeOrg.id },
  });

  if (refreshedNgo.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new Error('Step 5 Failed: NGO verification status was not updated to VERIFIED');
  }

  console.log(
    `[✓] STEP 5: Superadmin reviewed & VERIFIED NGO "City Hope Shelter". Org status is now: ${refreshedNgo.verificationStatus}.`,
  );

  // -------------------------------------------------------------------------
  // STEP 6: Volunteer ("Alex Courier") registers profile and enables availability
  // -------------------------------------------------------------------------
  const alexPasswordHash = await cryptoService.hashPassword('AlexCourier#2026');
  const alexUser = await prisma.user.create({
    data: {
      email: 'alex@courier.net',
      name: 'Alex Courier',
      phone: '+91-9988776655',
      passwordHash: alexPasswordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.userRole.create({
    data: {
      userId: alexUser.id,
      roleId: customerRole.id,
    },
  });

  const alexActor: AuthenticatedUser = {
    id: alexUser.id,
    email: alexUser.email,
    name: alexUser.name,
    status: UserStatus.ACTIVE,
    roles: ['customer'],
    permissions: ['delivery:accept'],
  };

  const volunteerProfile = await volunteersService.createProfile(
    {
      transportType: TransportType.MOTORBIKE,
      maxCapacity: 60,
      capacityUnit: 'MEALS',
    },
    alexActor,
  );

  // Superadmin verifies Alex's volunteer credentials
  await prisma.volunteerProfile.update({
    where: { id: volunteerProfile.id },
    data: { verificationStatus: VerificationStatus.VERIFIED, isAvailable: true },
  });

  await volunteersService.setAvailability({ isAvailable: true }, alexActor);

  const alexProfileSummary = await volunteersService.getMyProfile(alexActor);
  if (!alexProfileSummary.isAvailable || alexProfileSummary.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new Error('Step 6 Failed: Volunteer profile is not verified or available');
  }

  console.log(
    `[✓] STEP 6: Volunteer "Alex Courier" registered profile (ID: ${volunteerProfile.id}, Transport: MOTORBIKE) and availability toggled ON.`,
  );

  // -------------------------------------------------------------------------
  // STEP 7: Restaurant creates surplus donation: 50 portions of "Vegetable Biryani"
  // -------------------------------------------------------------------------
  const now = new Date();
  const allergenPeanuts = await prisma.foodAllergen.findFirst({ where: { name: 'Peanuts' } });
  const allergenDairy = await prisma.foodAllergen.findFirst({ where: { name: 'Dairy' } });

  const donation = await donationsService.createDonation(
    {
      organizationId: spiceGardenOrg.id,
      foodName: 'Vegetable Biryani',
      description: 'Freshly prepared aromatic basmati rice biryani cooked with seasonal vegetables and mild spices.',
      category: FoodCategory.MEALS,
      foodType: FoodType.VEG,
      totalQuantity: 50,
      unit: FoodUnit.MEALS,
      preparedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      availableFrom: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      collectionDeadline: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      storageType: StorageType.HOT,
      pickupPointId: restaurantPickupPoint.id,
      safetyDeclared: true,
      allergenIds: [allergenPeanuts.id, allergenDairy.id],
    },
    restaurantActor,
  );

  if (donation.status !== DonationStatus.AVAILABLE || Number(donation.totalQuantity) !== 50) {
    throw new Error('Step 7 Failed: Donation not created with expected quantity and AVAILABLE status');
  }

  console.log(
    `[✓] STEP 7: Restaurant created donation of 50 portions "Vegetable Biryani" (Donation ID: ${donation.id}) with safety declared & allergens tagged.`,
  );

  // -------------------------------------------------------------------------
  // STEP 8: Public discovery: unauthenticated retrieval of available donations
  // -------------------------------------------------------------------------
  const discoveryResult = await donationsService.listDonations({
    status: DonationStatus.AVAILABLE,
    page: 1,
    limit: 10,
  });

  const discoveredDonation = discoveryResult.items.find((d) => d.id === donation.id);
  if (!discoveredDonation) {
    throw new Error('Step 8 Failed: Published donation not found in public discovery');
  }

  if (discoveredDonation.remainingQuantity !== 50) {
    throw new Error(`Step 8 Failed: Expected remainingQuantity 50, got ${discoveredDonation.remainingQuantity}`);
  }

  console.log(
    `[✓] STEP 8: Public discovery retrieved available donations: Found "${discoveredDonation.foodName}" with remainingQuantity = ${discoveredDonation.remainingQuantity} portions.`,
  );

  // -------------------------------------------------------------------------
  // STEP 9: NGO submits claim for 30 portions with pickupMode = 'VOLUNTEER'
  // -------------------------------------------------------------------------
  const claim1 = await claimsService.submitClaim(
    donation.id,
    {
      ngoId: cityHopeOrg.id,
      requestedQuantity: 30,
      pickupMode: PickupMode.VOLUNTEER,
    },
    ngoActor,
  );

  if (claim1.status !== ClaimStatus.PENDING || Number(claim1.requestedQuantity) !== 30) {
    throw new Error('Step 9 Failed: Claim 1 requestedQuantity or status mismatch');
  }

  console.log(
    `[✓] STEP 9: NGO submitted Claim #1 (ID: ${claim1.id}) for 30 portions with pickupMode = 'VOLUNTEER'. Status: ${claim1.status}.`,
  );

  // -------------------------------------------------------------------------
  // STEP 10: Restaurant approves claim: generates QR tokens and fallback codes
  // -------------------------------------------------------------------------
  const approvalResult1 = await claimsService.approveClaim(
    claim1.id,
    { approvedQuantity: 30 },
    restaurantActor,
  );

  const delivery1 = approvalResult1.delivery;
  if (!delivery1 || !delivery1.pickupQrToken || !delivery1.deliveryQrToken || !delivery1.pickupCode || !delivery1.deliveryCode) {
    throw new Error('Step 10 Failed: Approval did not generate cryptographic delivery tokens or codes');
  }

  console.log(
    `[✓] STEP 10: Restaurant approved Claim #1. Generated Delivery ID: ${delivery1.id} with Pickup Token (${delivery1.pickupQrToken.slice(0, 8)}...) & Delivery Token (${delivery1.deliveryQrToken.slice(0, 8)}...).`,
  );

  // -------------------------------------------------------------------------
  // STEP 11: Volunteer Alex lists available deliveries (sees 1 task) and accepts it
  // -------------------------------------------------------------------------
  const availableTasks = await deliveriesService.listAvailableTasks(alexActor);
  if (availableTasks.length !== 1 || availableTasks[0].id !== delivery1.id) {
    throw new Error(`Step 11 Failed: Expected 1 available task (${delivery1.id}), found ${availableTasks.length}`);
  }

  const acceptedDelivery1 = await deliveriesService.acceptDelivery(delivery1.id, alexActor);
  if (acceptedDelivery1.status !== DeliveryStatus.ACCEPTED || acceptedDelivery1.volunteerId !== volunteerProfile.id) {
    throw new Error('Step 11 Failed: Delivery status was not updated to ACCEPTED or volunteerId mismatch');
  }

  const alexTaskLockCheck = await volunteersService.getMyProfile(alexActor);
  if (!alexTaskLockCheck.hasActiveTask || alexTaskLockCheck.activeDeliveryId !== delivery1.id) {
    throw new Error('Step 11 Failed: Volunteer active task lock is not engaged');
  }

  console.log(
    `[✓] STEP 11: Volunteer Alex listed available deliveries, discovered 1 task, and accepted Delivery ID: ${delivery1.id}. Active task lock confirmed.`,
  );

  // -------------------------------------------------------------------------
  // STEP 12: Single-task enforcement: verify 409 Conflict if Alex attempts another task
  // -------------------------------------------------------------------------
  let conflictCaughtListing = false;
  try {
    await deliveriesService.listAvailableTasks(alexActor);
  } catch (err) {
    if (err instanceof ConflictException) {
      conflictCaughtListing = true;
    }
  }

  let conflictCaughtAccepting = false;
  try {
    await deliveriesService.acceptDelivery('dummy-another-delivery-id', alexActor);
  } catch (err) {
    if (err instanceof ConflictException) {
      conflictCaughtAccepting = true;
    }
  }

  if (!conflictCaughtListing || !conflictCaughtAccepting) {
    throw new Error('Step 12 Failed: Single-task enforcement invariant failed to reject concurrent task attempt');
  }

  console.log(
    `[✓] STEP 12: Single-task enforcement verified: Alex attempting to list or accept another concurrent task rejected with 409 Conflict.`,
  );

  // -------------------------------------------------------------------------
  // STEP 13: Volunteer Alex confirms pickup at Restaurant using optical pickupQrToken
  // -------------------------------------------------------------------------
  const pickupResult = await deliveriesService.confirmPickup(
    delivery1.id,
    { qrToken: delivery1.pickupQrToken },
    alexActor,
  );

  if (pickupResult.status !== DeliveryStatus.IN_TRANSIT || !pickupResult.pickedUpAt) {
    throw new Error('Step 13 Failed: Delivery status was not updated to IN_TRANSIT on valid pickup token scan');
  }

  console.log(
    `[✓] STEP 13: Volunteer Alex confirmed pickup at Restaurant using optical QR token. Status transitioned to IN_TRANSIT (Picked up at: ${pickupResult.pickedUpAt.toISOString()}).`,
  );

  // -------------------------------------------------------------------------
  // STEP 14: Volunteer Alex pings live GPS location -> verifies distance and real-time ETA
  // -------------------------------------------------------------------------
  // Midpoint coordinate towards City Hope Shelter
  const pingLat = 12.975;
  const pingLng = 77.62;

  const locationUpdateResult = await volunteersService.updateLocation(
    { latitude: pingLat, longitude: pingLng },
    alexActor,
  );

  const liveTracking = await deliveriesService.getLiveTracking(delivery1.id);
  if (!liveTracking.estimatedArrivalAt || liveTracking.status !== DeliveryStatus.IN_TRANSIT) {
    throw new Error('Step 14 Failed: Live tracking ETA was not calculated upon GPS ping');
  }

  console.log(
    `[✓] STEP 14: Volunteer Alex pinged live GPS coordinates (${pingLat}, ${pingLng}). Real-time ETA calculated: ${liveTracking.estimatedArrivalAt.toISOString()} (Destination: ${liveTracking.ngo.name}).`,
  );

  // -------------------------------------------------------------------------
  // STEP 15: Volunteer Alex confirms delivery at NGO using deliveryQrToken -> DELIVERED & Alex freed
  // -------------------------------------------------------------------------
  const deliveryResult = await deliveriesService.confirmDelivery(
    delivery1.id,
    { qrToken: delivery1.deliveryQrToken },
    alexActor,
  );

  if (deliveryResult.status !== DeliveryStatus.DELIVERED || !deliveryResult.deliveredAt) {
    throw new Error('Step 15 Failed: Delivery status was not updated to DELIVERED');
  }

  const claim1PostDelivery = await prisma.donationClaim.findUnique({
    where: { id: claim1.id },
  });
  if (claim1PostDelivery.status !== ClaimStatus.COMPLETED) {
    throw new Error('Step 15 Failed: Donation Claim #1 status was not updated to COMPLETED');
  }

  const alexProfileFreed = await volunteersService.getMyProfile(alexActor);
  if (alexProfileFreed.hasActiveTask || alexProfileFreed.activeDeliveryId !== null) {
    throw new Error('Step 15 Failed: Volunteer Alex was not freed from active task lock upon delivery completion');
  }

  console.log(
    `[✓] STEP 15: Volunteer Alex confirmed delivery at NGO using deliveryQrToken. Status: DELIVERED, Claim #1 marked COMPLETED, and Volunteer Alex freed.`,
  );

  // -------------------------------------------------------------------------
  // STEP 16: Direct NGO pickup test: NGO claims remaining 20 portions with DIRECT_NGO
  // -------------------------------------------------------------------------
  // Verify remaining quantity before claim #2
  const midDiscovery = await donationsService.listDonations({
    status: DonationStatus.AVAILABLE,
    page: 1,
    limit: 10,
  });
  const remainingCheck = midDiscovery.items.find((d) => d.id === donation.id);
  if (remainingCheck.remainingQuantity !== 20) {
    throw new Error(`Step 16 Failed: Expected 20 remaining portions, found ${remainingCheck.remainingQuantity}`);
  }

  const claim2 = await claimsService.submitClaim(
    donation.id,
    {
      ngoId: cityHopeOrg.id,
      requestedQuantity: 20,
      pickupMode: PickupMode.DIRECT_NGO,
    },
    ngoActor,
  );

  const approvalResult2 = await claimsService.approveClaim(
    claim2.id,
    { approvedQuantity: 20 },
    restaurantActor,
  );

  const delivery2 = approvalResult2.delivery;
  if (delivery2.pickupMode !== PickupMode.DIRECT_NGO) {
    throw new Error('Step 16 Failed: Delivery 2 pickupMode is not DIRECT_NGO');
  }

  // Verify donation status is now CLOSED because 30 + 20 = 50 total allocated
  const closedDonation = await prisma.donation.findUnique({ where: { id: donation.id } });
  if (closedDonation.status !== DonationStatus.CLOSED) {
    throw new Error(`Step 16 Failed: Expected donation status CLOSED, got ${closedDonation.status}`);
  }

  // NGO representative Sister Mary performs 1-step direct handover scan at Restaurant
  const directHandover = await deliveriesService.confirmDirectHandover(
    delivery2.id,
    { qrToken: delivery2.pickupQrToken },
    ngoActor,
  );

  if (directHandover.status !== DeliveryStatus.DELIVERED || !directHandover.directHandoverAt) {
    throw new Error('Step 16 Failed: Direct handover delivery was not marked DELIVERED');
  }

  console.log(
    `[✓] STEP 16: Direct NGO pickup verified: Claim #2 (20 portions) approved with DIRECT_NGO; 1-step direct handover completed directly to DELIVERED status. Donation status CLOSED.`,
  );

  // -------------------------------------------------------------------------
  // STEP 17: NGO submits a 5-star review for Restaurant with aspect ratings
  // -------------------------------------------------------------------------
  const review = await reviewsService.createReview(
    {
      targetType: ReviewTargetType.ORGANIZATION,
      targetId: spiceGardenOrg.id,
      deliveryId: delivery1.id,
      rating: 5,
      comment: 'Outstanding food quality and hygienic hot packaging! 30 vulnerable residents were fed promptly.',
      aspects: {
        foodQuality: 5,
        packagingHygiene: 5,
        dispatchPunctuality: 5,
        communication: 5,
      },
    },
    ngoActor,
  );

  if (review.rating !== 5 || review.targetId !== spiceGardenOrg.id) {
    throw new Error('Step 17 Failed: Review was not persisted with 5-star rating');
  }

  console.log(
    `[✓] STEP 17: NGO "City Hope Shelter" submitted 5-star review for Restaurant "Spice Garden" with multi-criteria aspect ratings (Review ID: ${review.id}).`,
  );

  // -------------------------------------------------------------------------
  // STEP 18: Public checks reviews: verifies aggregate average rating is 5.0
  // -------------------------------------------------------------------------
  const targetReviews = await reviewsService.getTargetReviews(
    ReviewTargetType.ORGANIZATION,
    spiceGardenOrg.id,
    { page: 1, limit: 10 },
  );

  if (targetReviews.aggregate.totalReviews !== 1 || targetReviews.aggregate.averageRating !== 5) {
    throw new Error(
      `Step 18 Failed: Expected 1 review with averageRating 5.0, got ${targetReviews.aggregate.totalReviews} reviews with ${targetReviews.aggregate.averageRating}`,
    );
  }

  console.log(
    `[✓] STEP 18: Public verified Restaurant aggregate review score: ${targetReviews.aggregate.averageRating}.0 / 5.0 (${targetReviews.aggregate.totalReviews} review verified).`,
  );

  console.log('\n================================================================');
  console.log('=== ALL 18 WORKFLOW STEPS SIMULATED AND VERIFIED SUCCESSFULLY ===');
  console.log('================================================================\n');

  return {
    superAdmin: superAdminUser,
    restaurant: refreshedRestaurant,
    restaurantOwner: chefUser,
    ngo: refreshedNgo,
    ngoDirector: ngoLeaderUser,
    volunteer: alexUser,
    volunteerProfile: alexProfileFreed,
    donation,
    claim1,
    delivery1,
    claim2,
    delivery2,
    review,
    aggregateReviews: targetReviews.aggregate,
  };
}

// Direct CLI invocation
const isMainModule = process.argv[1]?.includes('simulate-workflow');
if (isMainModule) {
  runWorkflowSimulation()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n[X] Workflow simulation encountered an error:\n', err);
      process.exit(1);
    });
}
