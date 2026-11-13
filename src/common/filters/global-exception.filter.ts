import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

interface ErrorResponsePayload {
  statusCode: number;
  error: string;
  message: string | string[];
  code?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const payload = this.buildErrorPayload(exception, request.url);

    if (payload.statusCode >= 500) {
      const errorMsg = exception instanceof Error ? exception.message : 'Unknown internal error';
      this.logger.error(
        `[${request.method}] ${request.url} -> ${payload.statusCode}: ${errorMsg}`,
        exception instanceof Error && process.env.NODE_ENV !== 'production'
          ? exception.stack
          : undefined,
      );
    }

    response.status(payload.statusCode).json(payload);
  }

  private buildErrorPayload(exception: unknown, path: string): ErrorResponsePayload {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return {
          statusCode,
          error: HttpStatus[statusCode] ?? 'HttpException',
          message: res,
          timestamp,
          path,
        };
      }

      const body = res as Record<string, unknown>;
      return {
        statusCode,
        error: typeof body.error === 'string' ? body.error : HttpStatus[statusCode] ?? 'Error',
        message:
          Array.isArray(body.message) || typeof body.message === 'string'
            ? (body.message as string | string[])
            : exception.message,
        ...(typeof body.code === 'string' ? { code: body.code } : {}),
        timestamp,
        path,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: 'A record with this unique value already exists',
            code: 'RESOURCE_CONFLICT',
            timestamp,
            path,
          };
        case 'P2025':
          return {
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
            message: 'The requested resource was not found',
            code: 'RESOURCE_NOT_FOUND',
            timestamp,
            path,
          };
        case 'P2003':
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: 'Referenced resource does not exist or cannot be modified',
            code: 'INVALID_REFERENCE',
            timestamp,
            path,
          };
        default:
          return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: 'A database operation error occurred',
            timestamp,
            path,
          };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      timestamp,
      path,
    };
  }
}
