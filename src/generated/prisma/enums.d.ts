export declare const UserStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly SUSPENDED: "SUSPENDED";
    readonly DELETED: "DELETED";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const AuthProvider: {
    readonly GOOGLE: "GOOGLE";
};
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];
export declare const RoleScope: {
    readonly GLOBAL: "GLOBAL";
    readonly ORGANIZATION: "ORGANIZATION";
};
export type RoleScope = (typeof RoleScope)[keyof typeof RoleScope];
export declare const PermissionScope: {
    readonly GLOBAL: "GLOBAL";
    readonly ORGANIZATION: "ORGANIZATION";
    readonly BOTH: "BOTH";
};
export type PermissionScope = (typeof PermissionScope)[keyof typeof PermissionScope];
export declare const OrganizationStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly SUSPENDED: "SUSPENDED";
};
export type OrganizationStatus = (typeof OrganizationStatus)[keyof typeof OrganizationStatus];
export declare const MembershipStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly SUSPENDED: "SUSPENDED";
};
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];
export declare const InvitationStatus: {
    readonly PENDING: "PENDING";
    readonly ACCEPTED: "ACCEPTED";
    readonly REJECTED: "REJECTED";
    readonly REVOKED: "REVOKED";
    readonly EXPIRED: "EXPIRED";
};
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];
export declare const OrganizationType: {
    readonly RESTAURANT: "RESTAURANT";
    readonly NGO: "NGO";
    readonly BAKERY: "BAKERY";
    readonly CATERER: "CATERER";
    readonly EVENT_ORGANIZER: "EVENT_ORGANIZER";
};
export type OrganizationType = (typeof OrganizationType)[keyof typeof OrganizationType];
export declare const PickupMode: {
    readonly VOLUNTEER: "VOLUNTEER";
    readonly DIRECT_NGO: "DIRECT_NGO";
};
export type PickupMode = (typeof PickupMode)[keyof typeof PickupMode];
export declare const ReviewTargetType: {
    readonly ORGANIZATION: "ORGANIZATION";
    readonly VOLUNTEER: "VOLUNTEER";
    readonly DONATION: "DONATION";
};
export type ReviewTargetType = (typeof ReviewTargetType)[keyof typeof ReviewTargetType];
export declare const VerificationStatus: {
    readonly PENDING: "PENDING";
    readonly VERIFIED: "VERIFIED";
    readonly REJECTED: "REJECTED";
};
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];
export declare const TransportType: {
    readonly WALKING: "WALKING";
    readonly BICYCLE: "BICYCLE";
    readonly MOTORBIKE: "MOTORBIKE";
    readonly CAR: "CAR";
    readonly OTHER: "OTHER";
};
export type TransportType = (typeof TransportType)[keyof typeof TransportType];
export declare const FoodCategory: {
    readonly RICE: "RICE";
    readonly BREAD: "BREAD";
    readonly MEALS: "MEALS";
    readonly FRUITS: "FRUITS";
    readonly VEGETABLES: "VEGETABLES";
    readonly OTHER: "OTHER";
};
export type FoodCategory = (typeof FoodCategory)[keyof typeof FoodCategory];
export declare const FoodType: {
    readonly VEG: "VEG";
    readonly NON_VEG: "NON_VEG";
    readonly VEGAN: "VEGAN";
};
export type FoodType = (typeof FoodType)[keyof typeof FoodType];
export declare const FoodUnit: {
    readonly MEALS: "MEALS";
    readonly KG: "KG";
    readonly PACKETS: "PACKETS";
    readonly LITRES: "LITRES";
};
export type FoodUnit = (typeof FoodUnit)[keyof typeof FoodUnit];
export declare const StorageType: {
    readonly HOT: "HOT";
    readonly REFRIGERATED: "REFRIGERATED";
    readonly AMBIENT: "AMBIENT";
    readonly FROZEN: "FROZEN";
};
export type StorageType = (typeof StorageType)[keyof typeof StorageType];
export declare const DonationStatus: {
    readonly DRAFT: "DRAFT";
    readonly AVAILABLE: "AVAILABLE";
    readonly CLOSED: "CLOSED";
    readonly EXPIRED: "EXPIRED";
    readonly CANCELLED: "CANCELLED";
};
export type DonationStatus = (typeof DonationStatus)[keyof typeof DonationStatus];
export declare const SafetyCheckResult: {
    readonly PASS: "PASS";
    readonly FAIL: "FAIL";
    readonly NOT_APPLICABLE: "NOT_APPLICABLE";
};
export type SafetyCheckResult = (typeof SafetyCheckResult)[keyof typeof SafetyCheckResult];
export declare const ClaimStatus: {
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly CANCELLED: "CANCELLED";
    readonly COMPLETED: "COMPLETED";
};
export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus];
export declare const RequestPriority: {
    readonly LOW: "LOW";
    readonly NORMAL: "NORMAL";
    readonly HIGH: "HIGH";
    readonly URGENT: "URGENT";
};
export type RequestPriority = (typeof RequestPriority)[keyof typeof RequestPriority];
export declare const FoodRequestStatus: {
    readonly OPEN: "OPEN";
    readonly PARTIALLY_FULFILLED: "PARTIALLY_FULFILLED";
    readonly FULFILLED: "FULFILLED";
    readonly CANCELLED: "CANCELLED";
    readonly EXPIRED: "EXPIRED";
};
export type FoodRequestStatus = (typeof FoodRequestStatus)[keyof typeof FoodRequestStatus];
export declare const FulfillmentStatus: {
    readonly PROPOSED: "PROPOSED";
    readonly ACCEPTED: "ACCEPTED";
    readonly REJECTED: "REJECTED";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
};
export type FulfillmentStatus = (typeof FulfillmentStatus)[keyof typeof FulfillmentStatus];
export declare const DeliveryStatus: {
    readonly PENDING: "PENDING";
    readonly ASSIGNED: "ASSIGNED";
    readonly ACCEPTED: "ACCEPTED";
    readonly PICKED_UP: "PICKED_UP";
    readonly IN_TRANSIT: "IN_TRANSIT";
    readonly DELIVERED: "DELIVERED";
    readonly FAILED: "FAILED";
    readonly CANCELLED: "CANCELLED";
};
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];
export declare const AdminRoleType: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly ADMIN: "ADMIN";
    readonly REVIEWER: "REVIEWER";
};
export type AdminRoleType = (typeof AdminRoleType)[keyof typeof AdminRoleType];
export declare const DevicePlatform: {
    readonly ANDROID: "ANDROID";
    readonly IOS: "IOS";
    readonly WEB: "WEB";
};
export type DevicePlatform = (typeof DevicePlatform)[keyof typeof DevicePlatform];
