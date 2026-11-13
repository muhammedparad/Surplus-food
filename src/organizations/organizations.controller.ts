import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import {
  CurrentOrganization,
  UseOrganization,
} from '../common/decorators/org-context.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type {
  AuthenticatedUser,
  OrganizationContext,
} from '../common/interfaces/authenticated-user.interface.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { InvitationTokenDto } from './dto/invitation-token.dto.js';
import { InviteMemberDto } from './dto/invite-member.dto.js';
import {
  SwitchOrganizationDto,
  UpdateMemberRolesDto,
} from './dto/update-member-roles.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { OrganizationsService } from './organizations.service.js';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @RequirePermissions('organization:create')
  @ApiOperation({ summary: 'Create a new organization and become its owner' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.organizationsService.createOrganization(dto, actor);
  }

  @Get()
  @ApiOperation({ summary: 'List organizations where the authenticated user is an active member' })
  @ApiResponse({ status: 200, description: 'User organization memberships' })
  async listMyOrganizations(@CurrentUser() actor: AuthenticatedUser) {
    return this.organizationsService.listMyOrganizations(actor.id);
  }

  @Post('switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch active organization context for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Active organization switched' })
  @ApiResponse({ status: 403, description: 'Not a member of target organization' })
  async switchOrganization(
    @Body() dto: SwitchOrganizationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.organizationsService.switchActiveOrganization(actor, dto.organizationId);
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a single-use organization invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation accepted' })
  async acceptInvitation(
    @Body() dto: InvitationTokenDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.organizationsService.acceptInvitation(dto.token, actor);
  }

  @Post('invitations/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending organization invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation rejected' })
  async rejectInvitation(
    @Body() dto: InvitationTokenDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.organizationsService.rejectInvitation(dto.token, actor);
  }

  @Get(':id')
  @UseOrganization({ paramName: 'id' })
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'Get organization details (tenant-isolated membership check)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiHeader({ name: 'x-organization-id', required: false })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 403, description: 'Cross-tenant access denied' })
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentOrganization() orgContext: OrganizationContext,
  ) {
    return this.organizationsService.getOrganization(id, actor, orgContext);
  }

  @Patch(':id')
  @UseOrganization({ paramName: 'id' })
  @RequirePermissions('organization:update')
  @ApiOperation({ summary: 'Update organization details (requires organization:update)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentOrganization() orgContext: OrganizationContext,
  ) {
    return this.organizationsService.updateOrganization(id, dto, actor, orgContext);
  }

  @Get(':id/members')
  @UseOrganization({ paramName: 'id' })
  @RequirePermissions('organization_member:read')
  @ApiOperation({ summary: 'List members in an organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Organization members' })
  async listMembers(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.organizationsService.listMembers(id);
  }

  @Post(':id/invitations')
  @UseOrganization({ paramName: 'id' })
  @RequirePermissions('organization_member:invite')
  @ApiOperation({ summary: 'Invite a user to join an organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  async inviteMember(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentOrganization() orgContext: OrganizationContext,
  ) {
    return this.organizationsService.inviteMember(id, dto, actor, orgContext);
  }

  @Get(':id/invitations')
  @UseOrganization({ paramName: 'id' })
  @RequirePermissions('organization_member:invite', 'organization_member:read', {
    mode: 'OR',
  })
  @ApiOperation({ summary: 'List invitations for an organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Organization invitations' })
  async listInvitations(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.organizationsService.listInvitations(id);
  }

  @Delete(':id/invitations/:invitationId')
  @HttpCode(HttpStatus.OK)
  @UseOrganization({ paramName: 'id' })
  @RequirePermissions('organization_member:invite')
  @ApiOperation({ summary: 'Revoke a pending organization invitation' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'invitationId', format: 'uuid' })
  async revokeInvitation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('invitationId', new ParseUUIDPipe()) invitationId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.organizationsService.revokeInvitation(id, invitationId, actor);
  }

  @Patch(':id/members/:userId/roles')
  @UseOrganization({ paramName: 'id' })
  @RequirePermissions('organization_member:update', 'role:assign', { mode: 'AND' })
  @ApiOperation({ summary: 'Update roles assigned to an organization member' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  async updateMemberRoles(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateMemberRolesDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentOrganization() orgContext: OrganizationContext,
  ) {
    return this.organizationsService.updateMemberRoles(
      id,
      userId,
      dto,
      actor,
      orgContext,
    );
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @UseOrganization({ paramName: 'id' })
  @RequirePermissions('organization_member:remove')
  @ApiOperation({ summary: 'Remove a member from an organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  async removeMember(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentOrganization() orgContext: OrganizationContext,
  ) {
    return this.organizationsService.removeMember(id, userId, actor, orgContext);
  }
}
