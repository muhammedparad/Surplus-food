import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import type { Prisma, User } from '../generated/prisma/client.js';
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../common/constants/auth.constants.js';
import type { JwtAccessPayload } from '../common/interfaces/authenticated-user.interface.js';
import { CryptoService } from '../common/services/crypto.service.js';
import { parseDurationToMs } from '../common/utils/duration.util.js';
import type { AppConfig } from '../config/app.config.js';
import {
  type SessionClientMetadata,
  SessionsService,
} from '../sessions/sessions.service.js';

export interface SafeAuthUserResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  status: string;
  emailVerifiedAt: Date | null;
  activeOrganizationId: string | null;
}

export interface AuthTokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  sessionId: string;
  csrfToken: string;
  user: SafeAuthUserResponse;
}

@Injectable()
export class TokenIssuerService {
  private readonly jwtAccessExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private readonly cookieConfig: AppConfig['cookie'];
  private readonly apiPrefix: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
  ) {
    this.jwtAccessExpiresIn =
      this.configService.get<string>('auth.jwtAccessExpiresIn') ?? '15m';
    this.refreshTokenExpiresIn =
      this.configService.get<string>('auth.refreshTokenExpiresIn') ?? '30d';
    this.cookieConfig = this.configService.get<AppConfig['cookie']>('app.cookie') ?? {
      secret: '',
      sameSite: 'lax',
      secure: false,
    };
    this.apiPrefix = this.configService.get<string>('app.apiPrefix') ?? '';
  }

  signAccessToken(userId: string, sessionId: string, tokenVersion: number): string {
    const payload: JwtAccessPayload = {
      sub: userId,
      sid: sessionId,
      tv: tokenVersion,
      typ: 'access',
    };
    return this.jwtService.sign(payload);
  }

  toSafeUser(user: User): SafeAuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      activeOrganizationId: user.activeOrganizationId,
    };
  }

  async issueSessionAndTokens(
    user: User,
    metadata: SessionClientMetadata,
    tx?: Prisma.TransactionClient,
  ): Promise<AuthTokenBundle> {
    const { session, rawRefreshToken } = await this.sessionsService.createSession(
      user.id,
      metadata,
      tx,
    );

    const accessToken = this.signAccessToken(user.id, session.id, user.tokenVersion);
    const csrfToken = this.cryptoService.generateOpaqueToken(24);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.jwtAccessExpiresIn,
      sessionId: session.id,
      csrfToken,
      user: this.toSafeUser(user),
    };
  }

  private getRefreshCookiePath(): string {
    return this.apiPrefix ? `/${this.apiPrefix}/auth` : '/auth';
  }

  setAuthCookies(
    res: Response,
    bundle: Pick<AuthTokenBundle, 'accessToken' | 'refreshToken' | 'csrfToken'>,
  ): void {
    const baseOptions: CookieOptions = {
      httpOnly: true,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      domain: this.cookieConfig.domain,
    };

    res.cookie(ACCESS_TOKEN_COOKIE, bundle.accessToken, {
      ...baseOptions,
      path: '/',
      maxAge: parseDurationToMs(this.jwtAccessExpiresIn),
    });

    res.cookie(REFRESH_TOKEN_COOKIE, bundle.refreshToken, {
      ...baseOptions,
      path: this.getRefreshCookiePath(),
      maxAge: parseDurationToMs(this.refreshTokenExpiresIn),
    });

    // Double-submit CSRF cookie must be readable by frontend JS to send via x-csrf-token header
    res.cookie(CSRF_TOKEN_COOKIE, bundle.csrfToken, {
      httpOnly: false,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      domain: this.cookieConfig.domain,
      path: '/',
      maxAge: parseDurationToMs(this.refreshTokenExpiresIn),
    });
  }

  issueCsrfCookie(res: Response): string {
    const csrfToken = this.cryptoService.generateOpaqueToken(24);
    res.cookie(CSRF_TOKEN_COOKIE, csrfToken, {
      httpOnly: false,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      domain: this.cookieConfig.domain,
      path: '/',
      maxAge: parseDurationToMs(this.refreshTokenExpiresIn),
    });
    return csrfToken;
  }

  clearAuthCookies(res: Response): void {
    const baseOptions: CookieOptions = {
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      domain: this.cookieConfig.domain,
    };

    res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseOptions, httpOnly: true, path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      ...baseOptions,
      httpOnly: true,
      path: this.getRefreshCookiePath(),
    });
    res.clearCookie(CSRF_TOKEN_COOKIE, { ...baseOptions, httpOnly: false, path: '/' });
  }
}
