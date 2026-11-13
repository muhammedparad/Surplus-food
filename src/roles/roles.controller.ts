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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleScope } from '../generated/prisma/enums.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { AssignPermissionsDto } from './dto/assign-permissions.dto.js';
import { AssignUserRoleDto } from './dto/assign-user-role.dto.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { RolesService } from './roles.service.js';

@ApiTags('Roles & Role Assignments')
@ApiBearerAuth()
@Controller()
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post('roles')
  @RequirePermissions('role:create')
  @ApiOperation({ summary: 'Create a new dynamic role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.rolesService.create(dto, actor.id);
  }

  @Get('roles')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'List roles' })
  @ApiQuery({ name: 'scope', required: false, enum: RoleScope })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiResponse({ status: 200, description: 'List of roles with assigned permissions' })
  async findAll(
    @Query('scope') scope?: RoleScope,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.rolesService.findAll({ scope, organizationId });
  }

  @Get('roles/:id')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Get role details and permissions' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role details' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.findById(id);
  }

  @Patch('roles/:id')
  @RequirePermissions('role:update')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.rolesService.update(id, dto, actor.id);
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('role:delete')
  @ApiOperation({ summary: 'Delete a non-system custom role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  @ApiResponse({ status: 403, description: 'System roles cannot be deleted' })
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.rolesService.delete(id, actor.id);
    return { message: 'Role deleted successfully' };
  }

  @Post('roles/:id/permissions')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('role:update')
  @ApiOperation({ summary: 'Assign permissions to a role (add or replace)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Updated role permissions' })
  async assignPermissions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.rolesService.assignPermissions(id, dto, actor.id);
  }

  @Delete('roles/:id/permissions/:permissionId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('role:update')
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'permissionId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permission removed from role' })
  async removePermission(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('permissionId', new ParseUUIDPipe()) permissionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.rolesService.removePermission(id, permissionId, actor.id);
  }

  @Post('users/:id/roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('role:assign')
  @ApiOperation({ summary: 'Assign a global role to a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role assigned to user' })
  async assignRoleToUser(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() dto: AssignUserRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.rolesService.assignRoleToUser(userId, dto.roleId, actor.id);
  }

  @Delete('users/:id/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('role:assign')
  @ApiOperation({ summary: 'Remove a global role from a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role removed from user' })
  async removeRoleFromUser(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.rolesService.removeRoleFromUser(userId, roleId, actor.id);
  }

  @Get('users/:id/permissions')
  @RequirePermissions('user:read', 'role:read', { mode: 'OR' })
  @ApiOperation({ summary: 'Query effective permissions for a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiResponse({ status: 200, description: 'Effective roles and permissions' })
  async getUserEffectivePermissions(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.permissionsService.getEffectivePermissionsForUser(userId, organizationId);
  }
}
