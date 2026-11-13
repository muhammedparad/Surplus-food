// Complete TypeScript domain matching backend PostgreSQL schema and API contract

export type Role = 'restaurant' | 'event' | 'ngo' | 'volunteer' | 'public';

export type OrganizationType = 
  | 'RESTAURANT'
  | 'NGO'
  | 'BAKERY'
  | 'CATERER'
  | 'EVENT_ORGANIZER';

export type FoodCategory = 
  | 'RICE'
  | 'BREAD'
  | 'MEALS'
  | 'FRUITS'
  | 'VEGETABLES'
  | 'OTHER';

export type FoodType = 'VEG' | 'NON_VEG' | 'VEGAN';

export type StorageType = 'HOT' | 'REFRIGERATED' | 'AMBIENT' | 'FROZEN';

export type UnitType = 'MEALS' | 'KG' | 'PACKETS' | 'LITRES';

export type DonationStatus = 'DRAFT' | 'AVAILABLE' | 'CLOSED' | 'EXPIRED' | 'CANCELLED';

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export type PickupMode = 'VOLUNTEER' | 'DIRECT_NGO';

// Delivery Statuses: note backend enum IN_TRANSIT with architecture mapping
export type DeliveryStatus = 
  | 'PENDING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  role: Role;
  organizationId?: string;
  organizationType?: OrganizationType;
  organizationName?: string;
  volunteerProfileId?: string;
  isVerified?: boolean;
}

export interface PickupPoint {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  instructions?: string;
  isActive: boolean;
}

export interface DeliveryLocation {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  instructions?: string;
  isActive: boolean;
}

export interface Donation {
  id: string;
  organizationId: string;
  providerName: string;
  providerType: OrganizationType;
  isVerified: boolean;
  foodName: string;
  description?: string;
  category: FoodCategory;
  foodType: FoodType;
  totalQuantity: number;
  remainingQuantity: number;
  unit: UnitType;
  preparedAt: string;
  availableFrom: string;
  collectionDeadline: string;
  storageType: StorageType;
  pickupPointId: string;
  pickupAddress: string;
  pickupPointName: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  safetyDeclared: boolean;
  status: DonationStatus;
  allowPublicPickup: boolean;
  publicInstructions?: string;
  eventName?: string;
  eventType?: string;
  eventDate?: string;
  allergens: string[];
  imageUrls: string[];
  createdAt: string;
}

export interface DonationClaim {
  id: string;
  donationId: string;
  donation?: Donation;
  ngoId: string;
  ngoName: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  pickupMode: PickupMode;
  deliveryLocationId?: string;
  status: ClaimStatus;
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  qrCodeToken?: string;
}

export interface DeliveryTask {
  id: string;
  donationClaimId: string;
  donationId: string;
  donationTitle: string;
  providerName: string;
  providerAddress: string;
  providerPhone?: string;
  ngoName: string;
  deliveryAddress: string;
  ngoPhone?: string;
  quantity: number;
  unit: UnitType;
  pickupMode: PickupMode;
  volunteerId?: string;
  volunteerName?: string;
  status: DeliveryStatus;
  assignedAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  pickupCodeHash?: string;
  deliveryCodeHash?: string;
  failureReason?: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface VolunteerProfile {
  id: string;
  userId: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isAvailable: boolean;
  transportType: 'WALKING' | 'BICYCLE' | 'MOTORBIKE' | 'CAR' | 'OTHER';
  maxCapacity: number;
  capacityUnit: UnitType;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface AdvanceFoodRequest {
  id: string;
  ngoId: string;
  ngoName: string;
  foodCategory: FoodCategory;
  foodType: FoodType;
  requiredQuantity: number;
  unit: UnitType;
  requiredDate: string;
  requiredBefore: string;
  deliveryLocationId: string;
  deliveryAddress: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string;
  status: 'OPEN' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'DONATION' | 'CLAIM' | 'DELIVERY' | 'SYSTEM';
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ReviewRating {
  id: string;
  targetType: 'ORGANIZATION' | 'VOLUNTEER' | 'DONATION';
  targetId: string;
  authorId: string;
  authorName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}
