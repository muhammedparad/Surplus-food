import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UseOrganization } from '../common/decorators/org-context.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { AuditService } from './audit.service.js';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto.js';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('audit-logs')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'List platform-wide security audit logs (requires audit:read)' })
  @ApiResponse({ status: 200, description: 'Paginated audit log entries' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listPlatformAuditLogs(@Query() query: QueryAuditLogsDto) {
    return this.auditService.queryLogs(query);
  }

  @Get('organizations/:organizationId/audit-logs')
  @UseOrganization({ paramName: 'organizationId' })
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'List audit logs scoped to an organization' })
  @ApiParam({ name: 'organizationId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Paginated organization audit logs' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listOrganizationAuditLogs(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Query() query: QueryAuditLogsDto,
  ) {
    return this.auditService.queryLogs(query, organizationId);
  }
}
