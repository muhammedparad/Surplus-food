import {
  Body,
  Controller,
  Get,
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
import { PermissionScope } from '../generated/prisma/enums.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { PermissionsService } from './permissions.service.js';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermissions('permission:create')
  @ApiOperation({ summary: 'Create a dynamic granular permission (resource:action)' })
  @ApiResponse({ status: 201, description: 'Permission created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Permission already exists' })
  async create(
    @Body() dto: CreatePermissionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.permissionsService.create(dto, actor.id);
  }

  @Get()
  @RequirePermissions('permission:read')
  @ApiOperation({ summary: 'List permissions' })
  @ApiQuery({ name: 'resource', required: false })
  @ApiQuery({ name: 'scope', required: false, enum: PermissionScope })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async findAll(
    @Query('resource') resource?: string,
    @Query('scope') scope?: PermissionScope,
  ) {
    return this.permissionsService.findAll({ resource, scope });
  }

  @Get(':id')
  @RequirePermissions('permission:read')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permission details' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.permissionsService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions('permission:update')
  @ApiOperation({ summary: 'Update permission description or scope' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permission updated' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePermissionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.permissionsService.update(id, dto, actor.id);
  }
}
