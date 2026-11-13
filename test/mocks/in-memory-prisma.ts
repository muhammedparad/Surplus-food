/* eslint-disable */
// @ts-nocheck
import crypto from 'node:crypto';
import {
  ClaimStatus,
  DeliveryStatus,
  DonationStatus,
  FoodCategory,
  FoodType,
  FoodUnit,
  MembershipStatus,
  OrganizationStatus,
  OrganizationType,
  PermissionScope,
  PickupMode,
  ReviewTargetType,
  RoleScope,
  StorageType,
  TransportType,
  UserStatus,
  VerificationStatus,
} from '../../src/generated/prisma/enums.js';

function matchValue(actual: any, expected: any): boolean {
  if (expected === null || expected === undefined) {
    return actual === null || actual === undefined;
  }
  if (typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
    if ('in' in expected && Array.isArray(expected.in)) {
      return expected.in.includes(actual);
    }
    if ('not' in expected) {
      return actual !== expected.not;
    }
    if ('gt' in expected) {
      return new Date(actual).getTime() > new Date(expected.gt).getTime();
    }
    if ('gte' in expected) {
      return new Date(actual).getTime() >= new Date(expected.gte).getTime();
    }
    if ('lt' in expected) {
      return new Date(actual).getTime() < new Date(expected.lt).getTime();
    }
    if ('lte' in expected) {
      return new Date(actual).getTime() <= new Date(expected.lte).getTime();
    }
  }
  if (actual instanceof Date || expected instanceof Date) {
    return new Date(actual).getTime() === new Date(expected).getTime();
  }
  return actual === expected;
}

export class InMemoryTable<T extends { id?: string; [key: string]: any }> {
  public items: Map<string, T> = new Map();

  constructor(
    public readonly tableName: string,
    private readonly store: InMemoryPrismaStore,
  ) {}

  private matchRecord(record: T, where?: Record<string, any>): boolean {
    if (!where) return true;

    for (const [key, value] of Object.entries(where)) {
      if (key === 'organizationId_userId' && typeof value === 'object') {
        if (record.organizationId !== value.organizationId || record.userId !== value.userId) {
          return false;
        }
        continue;
      }
      if (key === 'userId_roleId' && typeof value === 'object') {
        if (record.userId !== value.userId || record.roleId !== value.roleId) {
          return false;
        }
        continue;
      }
      if (key === 'memberId_roleId' && typeof value === 'object') {
        if (record.memberId !== value.memberId || record.roleId !== value.roleId) {
          return false;
        }
        continue;
      }
      if (key === 'roleId_permissionId' && typeof value === 'object') {
        if (record.roleId !== value.roleId || record.permissionId !== value.permissionId) {
          return false;
        }
        continue;
      }
      if (key === 'donationId_allergenId' && typeof value === 'object') {
        if (record.donationId !== value.donationId || record.allergenId !== value.allergenId) {
          return false;
        }
        continue;
      }
      if (key === 'provider_providerUserId' && typeof value === 'object') {
        if (record.provider !== value.provider || record.providerUserId !== value.providerUserId) {
          return false;
        }
        continue;
      }
      if (key === 'scope_slug_organizationId' && typeof value === 'object') {
        if (
          record.scope !== value.scope ||
          record.slug !== value.slug ||
          (record.organizationId ?? null) !== (value.organizationId ?? null)
        ) {
          return false;
        }
        continue;
      }

      // Check relation filters
      if (key === 'role' && typeof value === 'object' && record.roleId) {
        const relatedRole = this.store.roles.get(record.roleId);
        if (!relatedRole || !this.matchRecord(relatedRole, value)) {
          return false;
        }
        continue;
      }

      if (!matchValue(record[key], value)) {
        return false;
      }
    }
    return true;
  }

  async findUnique(params: { where: Record<string, any>; include?: any; select?: any }): Promise<any> {
    return this.findFirst(params);
  }

  async findFirst(params: { where?: Record<string, any>; include?: any; select?: any; orderBy?: any }): Promise<any> {
    const list = await this.findMany(params);
    return list[0] ?? null;
  }

  async findMany(params?: {
    where?: Record<string, any>;
    include?: any;
    select?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }): Promise<any[]> {
    let result = Array.from(this.items.values()).filter((item) => this.matchRecord(item, params?.where));

    if (params?.orderBy) {
      const orderEntries = Object.entries(params.orderBy);
      result.sort((a, b) => {
        for (const [field, direction] of orderEntries) {
          const valA = a[field];
          const valB = b[field];
          if (valA === valB) continue;
          const dir = direction === 'desc' ? -1 : 1;
          if (valA > valB) return 1 * dir;
          if (valA < valB) return -1 * dir;
        }
        return 0;
      });
    }

    if (params?.skip) {
      result = result.slice(params.skip);
    }
    if (params?.take) {
      result = result.slice(0, params.take);
    }

    return result.map((item) => this.applyIncludeOrSelect({ ...item }, params?.include, params?.select));
  }

  async count(params?: { where?: Record<string, any> }): Promise<number> {
    return Array.from(this.items.values()).filter((item) => this.matchRecord(item, params?.where)).length;
  }

  async create(params: { data: any; include?: any; select?: any }): Promise<any> {
    const rawData = { ...params.data };
    const id = rawData.id ?? crypto.randomUUID();
    const now = new Date();

    const nestedCreates: { table: string; data: any[] }[] = [];

    // Extract nested creates
    if (rawData.documents?.create) {
      nestedCreates.push({
        table: 'verificationDocument',
        data: (Array.isArray(rawData.documents.create) ? rawData.documents.create : [rawData.documents.create]).map(
          (d: any) => ({ ...d, verificationRequestId: id }),
        ),
      });
      delete rawData.documents;
    }

    if (rawData.events?.create) {
      nestedCreates.push({
        table: 'deliveryEvent',
        data: (Array.isArray(rawData.events.create) ? rawData.events.create : [rawData.events.create]).map((e: any) => ({
          ...e,
          deliveryId: id,
        })),
      });
      delete rawData.events;
    }

    if (rawData.images?.create) {
      nestedCreates.push({
        table: 'donationImage',
        data: (Array.isArray(rawData.images.create) ? rawData.images.create : [rawData.images.create]).map((img: any) => ({
          ...img,
          donationId: id,
        })),
      });
      delete rawData.images;
    }

    if (rawData.allergens?.create) {
      nestedCreates.push({
        table: 'donationAllergen',
        data: (Array.isArray(rawData.allergens.create) ? rawData.allergens.create : [rawData.allergens.create]).map(
          (alg: any) => ({ ...alg, donationId: id }),
        ),
      });
      delete rawData.allergens;
    }

    const defaults: Record<string, any> = {};
    if (this.tableName === 'pickupPoints' || this.tableName === 'deliveryLocations') {
      defaults.isActive = true;
    } else if (this.tableName === 'organizations') {
      defaults.isActive = true;
      defaults.status = OrganizationStatus.ACTIVE;
      defaults.verificationStatus = VerificationStatus.PENDING;
    } else if (this.tableName === 'volunteerProfiles') {
      defaults.isAvailable = true;
      defaults.verificationStatus = VerificationStatus.PENDING;
    } else if (this.tableName === 'donations') {
      defaults.status = DonationStatus.AVAILABLE;
      defaults.safetyDeclared = false;
      defaults.allowPublicPickup = false;
    } else if (this.tableName === 'donationClaims') {
      defaults.status = ClaimStatus.PENDING;
      defaults.pickupMode = PickupMode.VOLUNTEER;
      defaults.approvedQuantity = null;
      defaults.reviewedAt = null;
      defaults.reviewedById = null;
      defaults.rejectionReason = null;
    } else if (this.tableName === 'deliveries') {
      defaults.status = DeliveryStatus.PENDING;
      defaults.pickupMode = PickupMode.VOLUNTEER;
      defaults.volunteerId = null;
      defaults.pickedUpAt = null;
      defaults.deliveredAt = null;
      defaults.estimatedArrivalAt = null;
      defaults.directHandoverAt = null;
      defaults.failureReason = null;
      defaults.currentLatitude = null;
      defaults.currentLongitude = null;
    }

    const record = {
      id,
      createdAt: rawData.createdAt ?? now,
      updatedAt: rawData.updatedAt ?? now,
      ...defaults,
      ...rawData,
    } as T;

    this.items.set(id, record);

    for (const nested of nestedCreates) {
      const table = (this.store as any)[nested.table] as InMemoryTable<any>;
      if (table) {
        for (const item of nested.data) {
          await table.create({ data: item });
        }
      }
    }

    return this.applyIncludeOrSelect({ ...record }, params.include, params.select);
  }

  async update(params: { where: Record<string, any>; data: any; include?: any; select?: any }): Promise<any> {
    const record = await this.findFirst({ where: params.where });
    if (!record) {
      throw new Error(`Record to update not found in ${this.tableName}`);
    }

    const rawData = { ...params.data };
    const now = new Date();

    if (rawData.events?.create) {
      const eventsData = Array.isArray(rawData.events.create) ? rawData.events.create : [rawData.events.create];
      for (const e of eventsData) {
        await this.store.deliveryEvent.create({ data: { ...e, deliveryId: record.id } });
      }
      delete rawData.events;
    }

    const updated = {
      ...record,
      ...rawData,
      updatedAt: rawData.updatedAt ?? now,
    };

    this.items.set(record.id, updated);
    return this.applyIncludeOrSelect({ ...updated }, params.include, params.select);
  }

  async upsert(params: { where: Record<string, any>; update: any; create: any; include?: any; select?: any }): Promise<any> {
    const existing = await this.findFirst({ where: params.where });
    if (existing) {
      return this.update({ where: params.where, data: params.update, include: params.include, select: params.select });
    }
    return this.create({ data: params.create, include: params.include, select: params.select });
  }

  async delete(params: { where: Record<string, any> }): Promise<any> {
    const existing = await this.findFirst({ where: params.where });
    if (existing) {
      this.items.delete(existing.id);
      return existing;
    }
    return null;
  }

  private applyIncludeOrSelect(item: any, include?: any, select?: any): any {
    if (!item) return item;

    const rel = { ...(include ?? {}), ...(select ?? {}) };

    // Resolve dynamic relations based on table
    if (this.tableName === 'organizations') {
      if (rel.members) {
        const members = Array.from(this.store.organizationMember.items.values())
          .filter((m) => m.organizationId === item.id)
          .filter((m) => (rel.members.where ? this.matchRecord(m, rel.members.where) : true))
          .map((m) => this.store.organizationMember.applyIncludeOrSelect(m, rel.members.include, rel.members.select));
        item.members = members;
      }
      if (rel.pickupPoints) {
        item.pickupPoints = Array.from(this.store.pickupPoint.items.values()).filter((p) => p.organizationId === item.id);
      }
      if (rel.deliveryLocations) {
        let locs = Array.from(this.store.deliveryLocation.items.values()).filter((l) => l.organizationId === item.id);
        if (rel.deliveryLocations.where?.isActive !== undefined) {
          locs = locs.filter((l) => l.isActive === rel.deliveryLocations.where.isActive);
        }
        if (rel.deliveryLocations.take) {
          locs = locs.slice(0, rel.deliveryLocations.take);
        }
        item.deliveryLocations = locs;
      }
    }

    if (this.tableName === 'organizationMembers') {
      if (rel.roles) {
        item.roles = Array.from(this.store.organizationMemberRole.items.values())
          .filter((r) => r.memberId === item.id)
          .map((r) => this.store.organizationMemberRole.applyIncludeOrSelect(r, rel.roles.include, rel.roles.select));
      }
      if (rel.user) {
        item.user = this.store.user.items.get(item.userId);
      }
      if (rel.organization) {
        item.organization = this.store.organization.items.get(item.organizationId);
      }
    }

    if (this.tableName === 'organizationMemberRoles') {
      if (rel.role) {
        item.role = this.store.role.items.get(item.roleId);
      }
    }

    if (this.tableName === 'userRoles') {
      if (rel.role) {
        const role = this.store.role.items.get(item.roleId);
        item.role = role ? this.store.role.applyIncludeOrSelect(role, rel.role.include, rel.role.select) : null;
      }
      if (rel.user) {
        item.user = this.store.user.items.get(item.userId);
      }
    }

    if (this.tableName === 'roles') {
      if (rel.rolePermissions) {
        item.rolePermissions = Array.from(this.store.rolePermission.items.values())
          .filter((rp) => rp.roleId === item.id)
          .map((rp) =>
            this.store.rolePermission.applyIncludeOrSelect(rp, rel.rolePermissions.include, rel.rolePermissions.select),
          );
      }
    }

    if (this.tableName === 'rolePermissions') {
      if (rel.permission) {
        item.permission = this.store.permission.items.get(item.permissionId);
      }
    }

    if (this.tableName === 'volunteerProfiles') {
      if (rel.user) {
        const user = this.store.user.items.get(item.userId);
        item.user = user ? this.store.user.applyIncludeOrSelect(user, rel.user.include, rel.user.select) : null;
      }
      if (rel.deliveries) {
        let dels = Array.from(this.store.delivery.items.values()).filter((d) => d.volunteerId === item.id);
        if (rel.deliveries.where) {
          dels = dels.filter((d) => this.matchRecord(d, rel.deliveries.where));
        }
        item.deliveries = dels;
      }
    }

    if (this.tableName === 'donations') {
      if (rel.organization) {
        item.organization = this.store.organization.items.get(item.organizationId);
      }
      if (rel.pickupPoint) {
        item.pickupPoint = this.store.pickupPoint.items.get(item.pickupPointId);
      }
      if (rel.images) {
        item.images = Array.from(this.store.donationImage.items.values())
          .filter((img) => img.donationId === item.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      }
      if (rel.allergens) {
        item.allergens = Array.from(this.store.donationAllergen.items.values())
          .filter((da) => da.donationId === item.id)
          .map((da) => ({
            ...da,
            allergen: this.store.foodAllergen.items.get(da.allergenId),
          }));
      }
      if (rel.claims) {
        let claims = Array.from(this.store.donationClaim.items.values()).filter((c) => c.donationId === item.id);
        if (rel.claims.where) {
          claims = claims.filter((c) => this.matchRecord(c, rel.claims.where));
        }
        item.claims = claims;
      }
    }

    if (this.tableName === 'donationClaims') {
      if (rel.donation) {
        const don = this.store.donation.items.get(item.donationId);
        item.donation = don ? this.store.donation.applyIncludeOrSelect(don, rel.donation.include, rel.donation.select) : null;
      }
      if (rel.ngo) {
        const ngo = this.store.organization.items.get(item.ngoId);
        item.ngo = ngo ? this.store.organization.applyIncludeOrSelect(ngo, rel.ngo.include, rel.ngo.select) : null;
      }
      if (rel.delivery) {
        item.delivery = Array.from(this.store.delivery.items.values()).find((d) => d.donationClaimId === item.id) ?? null;
      }
    }

    if (this.tableName === 'deliveries') {
      if (rel.volunteer) {
        const vol = this.store.volunteerProfile.items.get(item.volunteerId);
        item.volunteer = vol ? this.store.volunteerProfile.applyIncludeOrSelect(vol, rel.volunteer.include, rel.volunteer.select) : null;
      }
      if (rel.donationClaim) {
        const claim = this.store.donationClaim.items.get(item.donationClaimId);
        item.donationClaim = claim
          ? this.store.donationClaim.applyIncludeOrSelect(claim, rel.donationClaim.include, rel.donationClaim.select)
          : null;
      }
      if (rel.events) {
        item.events = Array.from(this.store.deliveryEvent.items.values()).filter((e) => e.deliveryId === item.id);
      }
    }

    if (this.tableName === 'verificationRequests') {
      if (rel.documents) {
        item.documents = Array.from(this.store.verificationDocument.items.values()).filter(
          (d) => d.verificationRequestId === item.id,
        );
      }
      if (rel.organization) {
        item.organization = this.store.organization.items.get(item.organizationId);
      }
      if (rel.volunteerProfile) {
        const vol = this.store.volunteerProfile.items.get(item.volunteerProfileId);
        item.volunteerProfile = vol
          ? this.store.volunteerProfile.applyIncludeOrSelect(vol, rel.volunteerProfile.include, rel.volunteerProfile.select)
          : null;
      }
      if (rel.submittedBy) {
        item.submittedBy = this.store.user.items.get(item.submittedById);
      }
      if (rel.reviewedBy) {
        item.reviewedBy = this.store.user.items.get(item.reviewedById);
      }
    }

    if (this.tableName === 'reviews') {
      if (rel.author) {
        item.author = this.store.user.items.get(item.authorId);
      }
      if (rel.delivery) {
        item.delivery = this.store.delivery.items.get(item.deliveryId);
      }
    }

    if (select) {
      const selected: Record<string, any> = {};
      for (const [key, enabled] of Object.entries(select)) {
        if (enabled) {
          selected[key] = item[key];
        }
      }
      return selected;
    }

    return item;
  }
}

export class InMemoryPrismaStore {
  public user = new InMemoryTable('users', this);
  public role = new InMemoryTable('roles', this);
  public userRole = new InMemoryTable('userRoles', this);
  public permission = new InMemoryTable('permissions', this);
  public rolePermission = new InMemoryTable('rolePermissions', this);
  public organization = new InMemoryTable('organizations', this);
  public organizationMember = new InMemoryTable('organizationMembers', this);
  public organizationMemberRole = new InMemoryTable('organizationMemberRoles', this);
  public pickupPoint = new InMemoryTable('pickupPoints', this);
  public deliveryLocation = new InMemoryTable('deliveryLocations', this);
  public volunteerProfile = new InMemoryTable('volunteerProfiles', this);
  public donation = new InMemoryTable('donations', this);
  public donationImage = new InMemoryTable('donationImages', this);
  public donationAllergen = new InMemoryTable('donationAllergens', this);
  public foodAllergen = new InMemoryTable('foodAllergens', this);
  public donationSafetyCheck = new InMemoryTable('donationSafetyChecks', this);
  public donationClaim = new InMemoryTable('donationClaims', this);
  public delivery = new InMemoryTable('deliveries', this);
  public deliveryEvent = new InMemoryTable('deliveryEvents', this);
  public verificationRequest = new InMemoryTable('verificationRequests', this);
  public verificationDocument = new InMemoryTable('verificationDocuments', this);
  public review = new InMemoryTable('reviews', this);
  public auditLog = new InMemoryTable('auditLogs', this);

  // Alias for casing consistency with schema queries
  get users() { return this.user.items; }
  get roles() { return this.role.items; }

  async $transaction<T>(action: ((tx: InMemoryPrismaStore) => Promise<T>) | Promise<any>[]): Promise<any> {
    if (typeof action === 'function') {
      return await action(this);
    }
    return await Promise.all(action);
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}

export async function seedInMemoryDatabase(prisma: InMemoryPrismaStore): Promise<void> {
  // 1. Permissions
  const permissionsList = [
    { key: 'user:create', resource: 'user', action: 'create' },
    { key: 'user:read', resource: 'user', action: 'read' },
    { key: 'user:update', resource: 'user', action: 'update' },
    { key: 'user:delete', resource: 'user', action: 'delete' },
    { key: 'role:create', resource: 'role', action: 'create' },
    { key: 'role:read', resource: 'role', action: 'read' },
    { key: 'role:assign', resource: 'role', action: 'assign' },
    { key: 'organization:create', resource: 'organization', action: 'create' },
    { key: 'organization:read', resource: 'organization', action: 'read' },
    { key: 'organization:update', resource: 'organization', action: 'update' },
    { key: 'organization_member:invite', resource: 'organization_member', action: 'invite' },
    { key: 'donation:create', resource: 'donation', action: 'create' },
    { key: 'donation:read', resource: 'donation', action: 'read' },
    { key: 'claim:create', resource: 'claim', action: 'create' },
    { key: 'claim:review', resource: 'claim', action: 'review' },
    { key: 'delivery:accept', resource: 'delivery', action: 'accept' },
    { key: 'delivery:read', resource: 'delivery', action: 'read' },
    { key: 'delivery:update', resource: 'delivery', action: 'update' },
    { key: 'verification:submit', resource: 'verification', action: 'submit' },
    { key: 'verification:read', resource: 'verification', action: 'read' },
    { key: 'verification:review', resource: 'verification', action: 'review' },
  ];

  for (const perm of permissionsList) {
    await prisma.permission.create({
      data: {
        key: perm.key,
        resource: perm.resource,
        action: perm.action,
        scope: PermissionScope.BOTH,
        isSystem: true,
      },
    });
  }

  // 2. Roles
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      slug: 'super_admin',
      scope: RoleScope.GLOBAL,
      isSystem: true,
      organizationId: null,
    },
  });

  const customerRole = await prisma.role.create({
    data: {
      name: 'Customer',
      slug: 'customer',
      scope: RoleScope.GLOBAL,
      isSystem: true,
      organizationId: null,
    },
  });

  const orgOwnerRole = await prisma.role.create({
    data: {
      name: 'Organization Owner',
      slug: 'org_owner',
      scope: RoleScope.ORGANIZATION,
      isSystem: true,
      organizationId: null,
    },
  });

  const orgAdminRole = await prisma.role.create({
    data: {
      name: 'Organization Admin',
      slug: 'org_admin',
      scope: RoleScope.ORGANIZATION,
      isSystem: true,
      organizationId: null,
    },
  });

  const orgMemberRole = await prisma.role.create({
    data: {
      name: 'Organization Member',
      slug: 'org_member',
      scope: RoleScope.ORGANIZATION,
      isSystem: true,
      organizationId: null,
    },
  });

  // Attach all permissions to super_admin
  const allPerms = await prisma.permission.findMany();
  for (const p of allPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: p.id,
      },
    });
  }

  // Attach delivery:accept to customer
  const deliveryAccept = allPerms.find((p) => p.key === 'delivery:accept');
  if (deliveryAccept) {
    await prisma.rolePermission.create({
      data: {
        roleId: customerRole.id,
        permissionId: deliveryAccept.id,
      },
    });
  }

  // 3. Allergens
  const allergens = ['Peanuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Tree Nuts', 'Fish', 'Shellfish'];
  for (const name of allergens) {
    await prisma.foodAllergen.create({
      data: { name },
    });
  }
}
