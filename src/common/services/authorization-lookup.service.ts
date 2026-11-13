import { Injectable } from '@nestjs/common';
import {
  MembershipStatus,
  OrganizationStatus,
  RoleScope,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { OrganizationContext } from '../interfaces/authenticated-user.interface.js';

export interface EffectiveAuthorization {
  roleSlugs: string[];
  permissionKeys: string[];
}

@Injectable()
export class AuthorizationLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalRolesAndPermissions(userId: string): Promise<EffectiveAuthorization> {
    const assignments = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: {
          scope: RoleScope.GLOBAL,
          organizationId: null,
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const roleSet = new Set<string>();
    const permissionSet = new Set<string>();

    for (const assignment of assignments) {
      roleSet.add(assignment.role.slug);
      for (const rp of assignment.role.rolePermissions) {
        permissionSet.add(rp.permission.key);
      }
    }

    return {
      roleSlugs: Array.from(roleSet),
      permissionKeys: Array.from(permissionSet),
    };
  }

  async getOrganizationMembershipContext(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationContext | null> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
        status: MembershipStatus.ACTIVE,
        organization: {
          status: OrganizationStatus.ACTIVE,
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        roles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return null;
    }

    const roleSet = new Set<string>();
    const permissionSet = new Set<string>();

    for (const memberRole of membership.roles) {
      if (memberRole.role.scope !== RoleScope.ORGANIZATION) {
        continue;
      }
      roleSet.add(memberRole.role.slug);
      for (const rp of memberRole.role.rolePermissions) {
        permissionSet.add(rp.permission.key);
      }
    }

    return {
      organizationId: membership.organization.id,
      organizationSlug: membership.organization.slug,
      organizationName: membership.organization.name,
      memberId: membership.id,
      roleSlugs: Array.from(roleSet),
      permissionKeys: Array.from(permissionSet),
    };
  }
}
