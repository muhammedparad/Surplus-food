import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    const { method, originalUrl } = request;

    // Strip query string from logs in case tokens appear in callback URLs
    const safePath = originalUrl.split('?')[0];

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(`${method} ${safePath} ${response.statusCode} +${duration}ms`);
        },
        error: () => {
          const duration = Date.now() - startTime;
          this.logger.warn(`${method} ${safePath} ERROR +${duration}ms`);
        },
      }),
    );
  }
}
