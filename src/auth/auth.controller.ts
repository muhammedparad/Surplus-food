import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  OAUTH_TX_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../common/constants/auth.constants.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { RequireVerifiedEmail } from '../common/decorators/require-verified-email.decorator.js';
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator.js';
import type {
  AuthenticatedUser,
  RequestWithAuth,
} from '../common/interfaces/authenticated-user.interface.js';
import type { AppConfig } from '../config/app.config.js';
import type { SessionClientMetadata } from '../sessions/sessions.service.js';
import { AuthService } from './auth.service.js';
import {
  GoogleIdTokenDto,
  LinkGoogleIdTokenDto,
  LinkGooglePrepareDto,
} from './dto/google-auth.dto.js';
import { LoginDto } from './dto/login.dto.js';
import {
  ForgotPasswordDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/recovery.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { GoogleOAuthService } from './google-oauth.service.js';
import { TokenIssuerService } from './token-issuer.service.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly cookieConfig: AppConfig['cookie'];

  constructor(
    private readonly authService: AuthService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly tokenIssuer: TokenIssuerService,
    private readonly configService: ConfigService,
  ) {
    this.cookieConfig = this.configService.get<AppConfig['cookie']>('app.cookie') ?? {
      secret: '',
      sameSite: 'lax',
      secure: false,
    };
  }

  private extractClientMeta(req: Request): SessionClientMetadata {
    return {
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    };
  }

  @Public()
  @SkipCsrf()
  @Get('csrf')
  @ApiOperation({ summary: 'Issue a CSRF double-submit cookie for browser SPAs' })
  @ApiResponse({ status: 200, description: 'CSRF token issued' })
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    const csrfToken = this.tokenIssuer.issueCsrfCookie(res);
    return { csrfToken };
  }

  @Public()
  @SkipCsrf()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account with email and password' })
  @ApiResponse({ status: 201, description: 'Account registered and verification email queued' })
  @ApiResponse({ status: 400, description: 'Validation or password policy failure' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.extractClientMeta(req));
  }

  @Public()
  @SkipCsrf()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with email and password (issues access/refresh tokens + optional HttpOnly cookies)',
  })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account suspended or email not verified' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const bundle = await this.authService.login(dto, this.extractClientMeta(req));

    if (dto.useCookies !== false) {
      this.tokenIssuer.setAuthCookies(res, bundle);
    }

    return {
      user: bundle.user,
      accessToken: bundle.accessToken,
      refreshToken: dto.useCookies === false ? bundle.refreshToken : undefined,
      expiresIn: bundle.expiresIn,
      sessionId: bundle.sessionId,
      csrfToken: dto.useCookies !== false ? bundle.csrfToken : undefined,
    };
  }

  @Public()
  @Throttle({ auth: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({
    summary: 'Rotate refresh token and issue a new access/refresh token pair',
  })
  @ApiResponse({ status: 200, description: 'Tokens rotated' })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or reused refresh token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: RequestWithAuth,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieRefresh = req.cookies?.[REFRESH_TOKEN_COOKIE];
    const rawRefreshToken = dto.refreshToken ?? cookieRefresh;
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const bundle = await this.authService.refreshTokens(
      rawRefreshToken,
      this.extractClientMeta(req),
    );

    const shouldSetCookies = dto.useCookies !== false || Boolean(cookieRefresh);
    if (shouldSetCookies) {
      this.tokenIssuer.setAuthCookies(res, bundle);
    }

    return {
      user: bundle.user,
      accessToken: bundle.accessToken,
      refreshToken: dto.refreshToken ? bundle.refreshToken : undefined,
      expiresIn: bundle.expiresIn,
      sessionId: bundle.sessionId,
      csrfToken: shouldSetCookies ? bundle.csrfToken : undefined,
    };
  }

  @Post('logout')
  @RequireVerifiedEmail(false)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from the current session and clear auth cookies' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(user, this.extractClientMeta(req));
    this.tokenIssuer.clearAuthCookies(res);
    return result;
  }

  @Post('logout-all')
  @RequireVerifiedEmail(false)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all active sessions across devices' })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logoutAll(user, this.extractClientMeta(req));
    this.tokenIssuer.clearAuthCookies(res);
    return result;
  }

  @Public()
  @SkipCsrf()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email with single-use verification token' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    return this.authService.verifyEmail(dto.token, this.extractClientMeta(req));
  }

  @Public()
  @SkipCsrf()
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link (anti-enumeration safe)' })
  @ApiResponse({ status: 200, description: 'Generic confirmation returned' })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @Req() req: Request,
  ) {
    return this.authService.resendVerification(dto.email, this.extractClientMeta(req));
  }

  @Public()
  @SkipCsrf()
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email (anti-enumeration safe)' })
  @ApiResponse({ status: 200, description: 'Generic confirmation returned' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto.email, this.extractClientMeta(req));
  }

  @Public()
  @SkipCsrf()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using single-use reset token and revoke all existing sessions',
  })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid/expired token or weak password' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, this.extractClientMeta(req));
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth 2.0 / OpenID Connect login or linking flow (PKCE + state)' })
  @ApiQuery({ name: 'redirectUrl', required: false })
  @ApiQuery({ name: 'mode', required: false, enum: ['login', 'link'] })
  @ApiQuery({ name: 'linkTicket', required: false })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen' })
  initiateGoogleAuth(
    @Query('redirectUrl') redirectUrl: string | undefined,
    @Query('mode') mode: 'login' | 'link' | undefined,
    @Query('linkTicket') linkTicket: string | undefined,
    @Res() res: Response,
  ): void {
    const { authorizationUrl, signedTxCookie } =
      this.googleOAuthService.buildAuthorizationRequest({
        redirectUrl,
        mode,
        linkTicket,
      });

    res.cookie(OAUTH_TX_COOKIE, signedTxCookie, {
      httpOnly: true,
      secure: this.cookieConfig.secure,
      sameSite: 'lax',
      domain: this.cookieConfig.domain,
      path: '/auth/google/callback',
      maxAge: 10 * 60 * 1000,
    });

    res.redirect(authorizationUrl);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth 2.0 callback with state, PKCE, and ID token verification' })
  @ApiResponse({ status: 200, description: 'Authenticated or linked via Google' })
  @ApiResponse({ status: 302, description: 'Redirects to allowlisted frontend callback URL' })
  @ApiResponse({ status: 409, description: 'Existing account requires authenticated linking' })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Req() req: RequestWithAuth,
    @Res() res: Response,
  ): Promise<void> {
    const signedTxCookie = req.cookies?.[OAUTH_TX_COOKIE];
    res.clearCookie(OAUTH_TX_COOKIE, {
      httpOnly: true,
      secure: this.cookieConfig.secure,
      sameSite: 'lax',
      domain: this.cookieConfig.domain,
      path: '/auth/google/callback',
    });

    const result = await this.googleOAuthService.handleCallback(
      { code, state, error, errorDescription },
      signedTxCookie,
      this.extractClientMeta(req),
    );

    if (result.mode === 'login' && result.bundle) {
      this.tokenIssuer.setAuthCookies(res, result.bundle);
      if (result.redirectUrl) {
        res.redirect(result.redirectUrl);
        return;
      }
      res.status(HttpStatus.OK).json({
        user: result.bundle.user,
        accessToken: result.bundle.accessToken,
        expiresIn: result.bundle.expiresIn,
        sessionId: result.bundle.sessionId,
        csrfToken: result.bundle.csrfToken,
      });
      return;
    }

    if (result.redirectUrl) {
      res.redirect(result.redirectUrl);
      return;
    }
    res.status(HttpStatus.OK).json({
      message: 'Google account linked successfully',
      linkedUserId: result.linkedUserId,
    });
  }

  @Public()
  @SkipCsrf()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in using a verified Google OIDC ID token (for Google One Tap / mobile SDKs)',
  })
  @ApiResponse({ status: 200, description: 'Authenticated via verified Google ID token' })
  async googleIdTokenLogin(
    @Body() dto: GoogleIdTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const bundle = await this.googleOAuthService.authenticateWithIdToken(
      dto.idToken,
      this.extractClientMeta(req),
    );

    if (dto.useCookies) {
      this.tokenIssuer.setAuthCookies(res, bundle);
    }

    return {
      user: bundle.user,
      accessToken: bundle.accessToken,
      refreshToken: dto.useCookies ? undefined : bundle.refreshToken,
      expiresIn: bundle.expiresIn,
      sessionId: bundle.sessionId,
      csrfToken: dto.useCookies ? bundle.csrfToken : undefined,
    };
  }

  @Post('google/link/prepare')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify account ownership before initiating browser Google OAuth linking',
  })
  @ApiResponse({ status: 200, description: 'Short-lived linkTicket issued' })
  async prepareGoogleLink(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LinkGooglePrepareDto,
  ) {
    return this.googleOAuthService.createLinkTicket(user, dto.currentPassword);
  }

  @Post('google/link')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link a Google identity to the authenticated account using a Google ID token',
  })
  @ApiResponse({ status: 200, description: 'Google identity linked' })
  async linkGoogleWithIdToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LinkGoogleIdTokenDto,
    @Req() req: Request,
  ) {
    return this.googleOAuthService.linkWithIdToken(
      user,
      dto.idToken,
      dto.currentPassword,
      this.extractClientMeta(req),
    );
  }

  @Delete('google/link')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink Google identity from the authenticated account' })
  @ApiResponse({ status: 200, description: 'Google identity unlinked' })
  @ApiResponse({ status: 409, description: 'Cannot unlink without a password set' })
  async unlinkGoogleAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.googleOAuthService.unlinkGoogleAccount(
      user,
      this.extractClientMeta(req),
    );
  }
}
