import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SKIP_CSRF_KEY,
} from '../constants/auth.constants.js';
import type { RequestWithAuth } from '../interfaces/authenticated-user.interface.js';
import { CryptoService } from '../services/crypto.service.js';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const enabled =
      this.configService.get<boolean>('app.csrfProtectionEnabled') ?? true;
    if (!enabled) {
      return true;
    }

    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const authHeader = request.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return true;
    }

    const hasAuthCookie = Boolean(
      request.cookies?.[ACCESS_TOKEN_COOKIE] || request.cookies?.[REFRESH_TOKEN_COOKIE],
    );
    if (!hasAuthCookie) {
      return true;
    }

    const origin = request.headers?.origin;
    if (typeof origin === 'string' && origin.length > 0) {
      const allowedOrigins =
        this.configService.get<string[]>('app.allowedOrigins') ?? [];
      if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
        throw new ForbiddenException('CSRF origin validation failed');
      }
    }

    const csrfCookie = request.cookies?.[CSRF_TOKEN_COOKIE];
    const rawCsrfHeader = request.headers?.[CSRF_HEADER_NAME];
    const csrfHeader = Array.isArray(rawCsrfHeader)
      ? rawCsrfHeader[0]
      : rawCsrfHeader;

    if (!csrfCookie || !csrfHeader) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (!this.cryptoService.timingSafeEqual(csrfCookie, csrfHeader)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
