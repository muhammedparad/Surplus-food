import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequireVerifiedEmail } from '../common/decorators/require-verified-email.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { SessionResponseDto } from './dto/session-response.dto.js';
import { SessionsService } from './sessions.service.js';

@ApiTags('Sessions')
@ApiBearerAuth()
@RequireVerifiedEmail(false)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List active sessions for the authenticated user' })
  @ApiResponse({ status: 200, type: [SessionResponseDto] })
  async listMySessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SessionResponseDto[]> {
    return this.sessionsService.listUserSessions(user.id, user.sessionId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific active session (owner or authorized admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @Req() req: Request,
  ) {
    await this.sessionsService.revokeSessionById(user, sessionId, {
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });
    return { message: 'Session revoked successfully' };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all sessions for the authenticated user except the current one' })
  @ApiResponse({ status: 200, description: 'Other active sessions revoked' })
  async revokeOtherSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const revokedCount = await this.sessionsService.revokeAllUserSessions(user.id, {
      exceptSessionId: user.sessionId,
      reason: 'REVOKED_OTHER_SESSIONS',
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });
    return { message: 'Other sessions revoked successfully', revokedCount };
  }
}
