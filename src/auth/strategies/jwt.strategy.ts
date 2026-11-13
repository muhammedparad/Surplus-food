import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserStatus } from '../../generated/prisma/enums.js';
import { ACCESS_TOKEN_COOKIE } from '../../common/constants/auth.constants.js';
import type {
  AuthenticatedUser,
  JwtAccessPayload,
} from '../../common/interfaces/authenticated-user.interface.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SessionsService } from '../../sessions/sessions.service.js';

function extractJwtFromRequest(req: Request): string | null {
  const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (bearer) return bearer;

  const cookies = (req as Request & { cookies?: Record<string, string | undefined> }).cookies;
  const cookieToken = cookies?.[ACCESS_TOKEN_COOKIE];
  return typeof cookieToken === 'string' && cookieToken.length > 0 ? cookieToken : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
  ) {
    const secret = configService.get<string>('auth.jwtAccessSecret');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    super({
      jwtFromRequest: extractJwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    if (
      !payload ||
      payload.typ !== 'access' ||
      !payload.sub ||
      !payload.sid ||
      typeof payload.tv !== 'number'
    ) {
      throw new UnauthorizedException('Malformed access token claims');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        status: UserStatus.ACTIVE,
        deletedAt: null,
        tokenVersion: payload.tv,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        status: true,
        emailVerifiedAt: true,
        activeOrganizationId: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Authentication session is no longer valid');
    }

    const sessionActive = await this.sessionsService.isSessionActive(
      payload.sid,
      user.id,
    );
    if (!sessionActive) {
      throw new UnauthorizedException('Session has expired or been revoked');
    }

    return {
      ...user,
      sessionId: payload.sid,
    };
  }
}
