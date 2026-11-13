import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateDeliveryLocationDto,
  UpdateDeliveryLocationDto,
} from './dto/delivery-location.dto.js';
import type {
  CreatePickupPointDto,
  UpdatePickupPointDto,
} from './dto/pickup-point.dto.js';

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authLookup: AuthorizationLookupService,
  ) {}

  private async assertOrgPermission(
    organizationId: string,
    actor: AuthenticatedUser,
    action: 'read' | 'manage',
  ) {
    const { roleSlugs: globalRoles } =
      await this.authLookup.getGlobalRolesAndPermissions(actor.id);
    if (globalRoles.includes('super_admin') || globalRoles.includes('admin')) {
      return;
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: actor.id,
        },
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('Not a member of the specified organization');
    }

    if (action === 'manage') {
      const isLeader = membership.roles.some((r) =>
        ['org_owner', 'org_admin'].includes(r.role.slug),
      );
      if (!isLeader) {
        throw new ForbiddenException(
          'Only organization owners and admins can manage logistics locations',
        );
      }
    }
  }

  // --- Pickup Points (Providers/Restaurants) ---

  async createPickupPoint(dto: CreatePickupPointDto, actor: AuthenticatedUser) {
    await this.assertOrgPermission(dto.organizationId, actor, 'manage');

    return this.prisma.pickupPoint.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name.trim(),
        address: dto.address.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        instructions: dto.instructions?.trim(),
      },
    });
  }

  async listPickupPoints(organizationId: string, actor: AuthenticatedUser) {
    await this.assertOrgPermission(organizationId, actor, 'read');

    return this.prisma.pickupPoint.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPickupPoint(id: string) {
    const point = await this.prisma.pickupPoint.findUnique({
      where: { id },
    });
    if (!point || !point.isActive) {
      throw new NotFoundException('Pickup point not found');
    }
    return point;
  }

  async updatePickupPoint(
    id: string,
    dto: UpdatePickupPointDto,
    actor: AuthenticatedUser,
  ) {
    const existing = await this.prisma.pickupPoint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Pickup point not found');
    }

    await this.assertOrgPermission(existing.organizationId, actor, 'manage');

    return this.prisma.pickupPoint.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.instructions !== undefined ? { instructions: dto.instructions?.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  // --- Delivery Locations (NGOs) ---

  async createDeliveryLocation(dto: CreateDeliveryLocationDto, actor: AuthenticatedUser) {
    await this.assertOrgPermission(dto.organizationId, actor, 'manage');

    return this.prisma.deliveryLocation.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name.trim(),
        address: dto.address.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        instructions: dto.instructions?.trim(),
      },
    });
  }

  async listDeliveryLocations(organizationId: string, actor: AuthenticatedUser) {
    await this.assertOrgPermission(organizationId, actor, 'read');

    return this.prisma.deliveryLocation.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeliveryLocation(id: string) {
    const loc = await this.prisma.deliveryLocation.findUnique({
      where: { id },
    });
    if (!loc || !loc.isActive) {
      throw new NotFoundException('Delivery location not found');
    }
    return loc;
  }

  async updateDeliveryLocation(
    id: string,
    dto: UpdateDeliveryLocationDto,
    actor: AuthenticatedUser,
  ) {
    const existing = await this.prisma.deliveryLocation.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Delivery location not found');
    }

    await this.assertOrgPermission(existing.organizationId, actor, 'manage');

    return this.prisma.deliveryLocation.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.instructions !== undefined ? { instructions: dto.instructions?.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }
}
