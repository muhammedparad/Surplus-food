import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InvitationStatus,
  MembershipStatus,
  OrganizationStatus,
  RoleScope,
} from '../generated/prisma/enums.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/security.enums.js';
import type {
  AuthenticatedUser,
  OrganizationContext,
} from '../common/interfaces/authenticated-user.interface.js';
import { AuthorizationLookupService } from '../common/services/authorization-lookup.service.js';
import { CryptoService } from '../common/services/crypto.service.js';
import { PolicyRegistryService } from '../common/services/policy-registry.service.js';
import { addDurationToNow } from '../common/utils/duration.util.js';
import { EmailService } from '../email/email.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrganizationDto } from './dto/create-organization.dto.js';
import type { InviteMemberDto } from './dto/invite-member.dto.js';
import type { UpdateMemberRolesDto } from './dto/update-member-roles.dto.js';
import type { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { OrganizationResourcePolicy } from './organization.policy.js';

export const ORGANIZATION_POLICY_KEY = 'organization';

@Injectable()
export class OrganizationsService implements OnModuleInit {
  private readonly invitationExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
    private readonly authLookup: AuthorizationLookupService,
    private readonly policyRegistry: PolicyRegistryService,
    private readonly organizationPolicy: OrganizationResourcePolicy,
    private readonly configService: ConfigService,
  ) {
    this.invitationExpiresIn =
      this.configService.get<string>('auth.invitationExpiresIn') ?? '7d';
  }

  onModuleInit(): void {
    this.policyRegistry.register(ORGANIZATION_POLICY_KEY, this.organizationPolicy);
  }

  private assertOrganizationsEnabled(): void {
    const enabled = this.configService.get<boolean>('auth.enableOrganizations') ?? true;
    if (!enabled) {
      throw new ForbiddenException('Organization support is disabled');
    }
  }

  private normalizeSlug(nameOrSlug: string): string {
    return nameOrSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async createOrganization(dto: CreateOrganizationDto, actor: AuthenticatedUser) {
    this.assertOrganizationsEnabled();

    const slug = this.normalizeSlug(dto.slug ?? dto.name);
    if (!slug) {
      throw new BadRequestException('A valid organization slug could not be derived');
    }

    const existing = await this.prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Organization slug "${slug}" is already taken`);
    }

    const ownerRole = await this.prisma.role.findFirst({
      where: {
        scope: RoleScope.ORGANIZATION,
        slug: 'org_owner',
        organizationId: null,
      },
    });
    if (!ownerRole) {
      throw new NotFoundException(
        'System organization role "org_owner" is missing; run seed first',
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.name.trim(),
          slug,
          type: dto.type,
          description: dto.description?.trim(),
          email: dto.email?.trim().toLowerCase(),
          phone: dto.phone?.trim(),
          registrationNumber: dto.registrationNumber?.trim(),
          registeredAddress: dto.registeredAddress?.trim(),
          latitude: dto.latitude,
          longitude: dto.longitude,
          isHidden: dto.isHidden ?? false,
          beneficiaryCount: dto.beneficiaryCount,
          servingCapacity: dto.servingCapacity,
          createdById: actor.id,
        },
      });

      const membership = await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: actor.id,
          status: MembershipStatus.ACTIVE,
        },
      });

      await tx.organizationMemberRole.create({
        data: {
          memberId: membership.id,
          roleId: ownerRole.id,
          assignedById: actor.id,
        },
      });

      if (!actor.activeOrganizationId) {
        await tx.user.update({
          where: { id: actor.id },
          data: { activeOrganizationId: organization.id },
        });
      }

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.ORG_CREATED,
          targetType: 'Organization',
          targetId: organization.id,
          organizationId: organization.id,
          metadata: { slug: organization.slug },
        },
        tx,
      );

      return organization;
    });

    return created;
  }

  async listMyOrganizations(userId: string) {
    this.assertOrganizationsEnabled();

    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        organization: { status: OrganizationStatus.ACTIVE },
      },
      include: {
        organization: true,
        roles: {
          include: {
            role: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      organization: m.organization,
      membershipStatus: m.status,
      joinedAt: m.joinedAt,
      roles: m.roles.map((r) => r.role),
    }));
  }

  async getOrganization(
    organizationId: string,
    actor: AuthenticatedUser,
    orgContext: OrganizationContext,
  ) {
    this.assertOrganizationsEnabled();

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    await this.policyRegistry.authorizeOrThrow(
      ORGANIZATION_POLICY_KEY,
      actor,
      'read',
      org,
      orgContext,
    );

    return {
      ...org,
      currentUserRoles: orgContext.roleSlugs,
      currentUserPermissions: orgContext.permissionKeys,
    };
  }

  async updateOrganization(
    organizationId: string,
    dto: UpdateOrganizationDto,
    actor: AuthenticatedUser,
    orgContext: OrganizationContext,
  ) {
    this.assertOrganizationsEnabled();

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    await this.policyRegistry.authorizeOrThrow(
      ORGANIZATION_POLICY_KEY,
      actor,
      'update',
      org,
      orgContext,
    );

    const slug = dto.slug ? this.normalizeSlug(dto.slug) : undefined;
    if (slug && slug !== org.slug) {
      const conflict = await this.prisma.organization.findUnique({ where: { slug } });
      if (conflict) {
        throw new ConflictException(`Organization slug "${slug}" is already taken`);
      }
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.trim().toLowerCase() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() } : {}),
        ...(dto.registrationNumber !== undefined ? { registrationNumber: dto.registrationNumber?.trim() } : {}),
        ...(dto.registeredAddress !== undefined ? { registeredAddress: dto.registeredAddress?.trim() } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.isHidden !== undefined ? { isHidden: dto.isHidden } : {}),
        ...(dto.beneficiaryCount !== undefined ? { beneficiaryCount: dto.beneficiaryCount } : {}),
        ...(dto.servingCapacity !== undefined ? { servingCapacity: dto.servingCapacity } : {}),
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.ORG_UPDATED,
      targetType: 'Organization',
      targetId: organizationId,
      organizationId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return updated;
  }

  async switchActiveOrganization(actor: AuthenticatedUser, organizationId: string) {
    this.assertOrganizationsEnabled();

    const orgContext = await this.authLookup.getOrganizationMembershipContext(
      actor.id,
      organizationId,
    );
    if (!orgContext) {
      throw new ForbiddenException(
        'Cannot switch to an organization where you are not an active member',
      );
    }

    await this.prisma.user.update({
      where: { id: actor.id },
      data: { activeOrganizationId: organizationId },
    });

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.ORG_SWITCHED,
      targetType: 'Organization',
      targetId: organizationId,
      organizationId,
    });

    return {
      activeOrganizationId: organizationId,
      organization: {
        id: orgContext.organizationId,
        name: orgContext.organizationName,
        slug: orgContext.organizationSlug,
      },
      roles: orgContext.roleSlugs,
      permissions: orgContext.permissionKeys,
    };
  }

  async listMembers(organizationId: string) {
    this.assertOrganizationsEnabled();

    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            status: true,
          },
        },
        roles: {
          include: {
            role: {
              select: { id: true, name: true, slug: true, scope: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.userId,
      status: m.status,
      joinedAt: m.joinedAt,
      user: m.user,
      roles: m.roles.map((r) => r.role),
    }));
  }

  async inviteMember(
    organizationId: string,
    dto: InviteMemberDto,
    actor: AuthenticatedUser,
    orgContext: OrganizationContext,
  ) {
    this.assertOrganizationsEnabled();

    const normalizedEmail = dto.email.trim().toLowerCase();

    const role = await this.resolveOrganizationRole(
      organizationId,
      dto.roleId,
      dto.roleSlug ?? 'org_member',
    );

    if (role.slug === 'org_owner' && !orgContext.roleSlugs.includes('org_owner')) {
      throw new ForbiddenException(
        'Only an organization owner can invite another organization owner',
      );
    }

    const existingMember = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        user: { email: normalizedEmail },
      },
    });
    if (existingMember) {
      throw new ConflictException('User is already a member of this organization');
    }

    const existingPending = await this.prisma.organizationInvitation.findFirst({
      where: {
        organizationId,
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingPending) {
      throw new ConflictException('An active invitation for this email already exists');
    }

    const rawToken = this.cryptoService.generateOpaqueToken(36);
    const tokenHash = this.cryptoService.hashToken(rawToken);
    const expiresAt = addDurationToNow(this.invitationExpiresIn);

    const invitation = await this.prisma.organizationInvitation.create({
      data: {
        organizationId,
        email: normalizedEmail,
        roleId: role.id,
        invitedById: actor.id,
        tokenHash,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
      select: {
        id: true,
        organizationId: true,
        email: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        role: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    this.emailService.sendOrganizationInvitationEmail({
      to: normalizedEmail,
      organizationName: orgContext.organizationName,
      inviterName: actor.name,
      roleName: role.name,
      rawToken,
      expiresIn: this.invitationExpiresIn,
    });

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.ORG_INVITATION_SENT,
      targetType: 'OrganizationInvitation',
      targetId: invitation.id,
      organizationId,
      metadata: { invitedEmail: normalizedEmail, roleSlug: role.slug },
    });

    return invitation;
  }

  async listInvitations(organizationId: string) {
    this.assertOrganizationsEnabled();

    return this.prisma.organizationInvitation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        organizationId: true,
        email: true,
        status: true,
        expiresAt: true,
        respondedAt: true,
        createdAt: true,
        role: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async revokeInvitation(
    organizationId: string,
    invitationId: string,
    actor: AuthenticatedUser,
  ) {
    this.assertOrganizationsEnabled();

    const invitation = await this.prisma.organizationInvitation.findFirst({
      where: { id: invitationId, organizationId },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found in this organization');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    await this.prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.REVOKED, respondedAt: new Date() },
    });

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.ORG_INVITATION_REVOKED,
      targetType: 'OrganizationInvitation',
      targetId: invitation.id,
      organizationId,
    });

    return { message: 'Invitation revoked' };
  }

  async acceptInvitation(rawToken: string, actor: AuthenticatedUser) {
    this.assertOrganizationsEnabled();

    if (!actor.emailVerifiedAt) {
      throw new ForbiddenException(
        'Verify your email address before accepting organization invitations',
      );
    }

    const tokenHash = this.cryptoService.hashToken(rawToken);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.organizationInvitation.findUnique({
        where: { tokenHash },
        include: {
          organization: true,
          role: true,
        },
      });

      if (!invitation) {
        throw new NotFoundException('Invalid invitation token');
      }
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException('Invitation has already been responded to or revoked');
      }
      if (invitation.expiresAt <= now) {
        await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED },
        });
        throw new BadRequestException('Invitation has expired');
      }
      if (invitation.email !== actor.email.toLowerCase()) {
        throw new ForbiddenException(
          'This invitation was issued to a different email address',
        );
      }
      if (invitation.organization.status !== OrganizationStatus.ACTIVE) {
        throw new ForbiddenException('Target organization is not active');
      }

      const claimed = await tx.organizationInvitation.updateMany({
        where: { id: invitation.id, status: InvitationStatus.PENDING },
        data: { status: InvitationStatus.ACCEPTED, respondedAt: now },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('Invitation has already been processed');
      }

      const existingMember = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: actor.id,
          },
        },
      });
      if (existingMember) {
        throw new ConflictException('You are already a member of this organization');
      }

      const member = await tx.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: actor.id,
          status: MembershipStatus.ACTIVE,
        },
      });

      await tx.organizationMemberRole.create({
        data: {
          memberId: member.id,
          roleId: invitation.roleId,
          assignedById: invitation.invitedById,
        },
      });

      if (!actor.activeOrganizationId) {
        await tx.user.update({
          where: { id: actor.id },
          data: { activeOrganizationId: invitation.organizationId },
        });
      }

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.ORG_INVITATION_ACCEPTED,
          targetType: 'OrganizationInvitation',
          targetId: invitation.id,
          organizationId: invitation.organizationId,
          metadata: { roleSlug: invitation.role.slug },
        },
        tx,
      );

      return {
        organizationId: invitation.organizationId,
        organizationName: invitation.organization.name,
        roleSlug: invitation.role.slug,
      };
    });

    return result;
  }

  async rejectInvitation(rawToken: string, actor: AuthenticatedUser) {
    this.assertOrganizationsEnabled();

    const tokenHash = this.cryptoService.hashToken(rawToken);
    const now = new Date();

    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { tokenHash },
    });
    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }
    if (invitation.email !== actor.email.toLowerCase()) {
      throw new ForbiddenException(
        'This invitation was issued to a different email address',
      );
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer pending');
    }
    if (invitation.expiresAt <= now) {
      await this.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }

    await this.prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.REJECTED, respondedAt: now },
    });

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.ORG_INVITATION_REJECTED,
      targetType: 'OrganizationInvitation',
      targetId: invitation.id,
      organizationId: invitation.organizationId,
    });

    return { message: 'Invitation rejected' };
  }

  async updateMemberRoles(
    organizationId: string,
    targetUserId: string,
    dto: UpdateMemberRolesDto,
    actor: AuthenticatedUser,
    orgContext: OrganizationContext,
  ) {
    this.assertOrganizationsEnabled();

    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
      include: {
        roles: { include: { role: true } },
      },
    });
    if (!member) {
      throw new NotFoundException('Organization member not found');
    }

    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: dto.roleIds },
        scope: RoleScope.ORGANIZATION,
        OR: [{ organizationId: null }, { organizationId }],
      },
    });
    if (roles.length !== dto.roleIds.length) {
      throw new BadRequestException(
        'All roleIds must be valid ORGANIZATION roles belonging to this organization or shared templates',
      );
    }

    const actorIsOwner = orgContext.roleSlugs.includes('org_owner');
    const targetCurrentlyOwner = member.roles.some((r) => r.role.slug === 'org_owner');
    const targetWillBeOwner = roles.some((r) => r.slug === 'org_owner');

    if ((targetCurrentlyOwner || targetWillBeOwner) && !actorIsOwner) {
      throw new ForbiddenException(
        'Only an organization owner can assign or revoke the org_owner role',
      );
    }

    if (targetCurrentlyOwner && !targetWillBeOwner) {
      await this.assertNotLastOrganizationOwner(organizationId, member.id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.organizationMemberRole.deleteMany({
        where: { memberId: member.id },
      });

      await tx.organizationMemberRole.createMany({
        data: roles.map((role) => ({
          memberId: member.id,
          roleId: role.id,
          assignedById: actor.id,
        })),
      });

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.ORG_MEMBER_ROLE_UPDATED,
          targetType: 'OrganizationMember',
          targetId: member.id,
          organizationId,
          metadata: {
            targetUserId,
            roleSlugs: roles.map((r) => r.slug),
          },
        },
        tx,
      );
    });

    return {
      organizationId,
      userId: targetUserId,
      roles: roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug })),
    };
  }

  async removeMember(
    organizationId: string,
    targetUserId: string,
    actor: AuthenticatedUser,
    orgContext: OrganizationContext,
  ) {
    this.assertOrganizationsEnabled();

    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
      include: {
        roles: { include: { role: true } },
      },
    });
    if (!member) {
      throw new NotFoundException('Organization member not found');
    }

    const targetIsOwner = member.roles.some((r) => r.role.slug === 'org_owner');
    if (targetIsOwner) {
      if (!orgContext.roleSlugs.includes('org_owner')) {
        throw new ForbiddenException('Only an organization owner can remove an owner');
      }
      await this.assertNotLastOrganizationOwner(organizationId, member.id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.organizationMember.delete({
        where: { id: member.id },
      });

      await tx.user.updateMany({
        where: { id: targetUserId, activeOrganizationId: organizationId },
        data: { activeOrganizationId: null },
      });

      await this.auditService.record(
        {
          actorId: actor.id,
          action: AuditAction.ORG_MEMBER_REMOVED,
          targetType: 'OrganizationMember',
          targetId: member.id,
          organizationId,
          metadata: { removedUserId: targetUserId },
        },
        tx,
      );
    });

    return { message: 'Member removed from organization' };
  }

  private async resolveOrganizationRole(
    organizationId: string,
    roleId?: string,
    roleSlug?: string,
  ) {
    const role = roleId
      ? await this.prisma.role.findFirst({
          where: {
            id: roleId,
            scope: RoleScope.ORGANIZATION,
            OR: [{ organizationId: null }, { organizationId }],
          },
        })
      : await this.prisma.role.findFirst({
          where: {
            slug: roleSlug,
            scope: RoleScope.ORGANIZATION,
            OR: [{ organizationId }, { organizationId: null }],
          },
        });

    if (!role) {
      throw new NotFoundException('Specified organization role was not found');
    }
    return role;
  }

  private async assertNotLastOrganizationOwner(
    organizationId: string,
    memberId: string,
  ): Promise<void> {
    const otherOwners = await this.prisma.organizationMemberRole.count({
      where: {
        memberId: { not: memberId },
        member: {
          organizationId,
          status: MembershipStatus.ACTIVE,
        },
        role: {
          scope: RoleScope.ORGANIZATION,
          slug: 'org_owner',
        },
      },
    });

    if (otherOwners === 0) {
      throw new ConflictException(
        'Cannot remove or demote the last owner of an organization',
      );
    }
  }
}
