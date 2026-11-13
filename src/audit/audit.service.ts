import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';
import type { AuditAction } from '../common/enums/security.enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { QueryAuditLogsDto } from './dto/query-audit-logs.dto.js';

export interface CreateAuditLogInput {
  actorId?: string | null;
  action: AuditAction | string;
  targetType?: string | null;
  targetId?: string | null;
  organizationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEY_PATTERN = /(password|secret|token|hash|authorization|cookie|credential)/i;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  sanitizeMetadata(
    metadata?: Record<string, unknown>,
  ): Prisma.InputJsonValue | undefined {
    if (!metadata) return undefined;
    return this.sanitizeObject(metadata) as Prisma.InputJsonValue;
  }

  private sanitizeObject(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeObject(item));
    }
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toISOString();
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = this.sanitizeObject(val);
        }
      }
      return result;
    }
    return value;
  }

  async record(
    entry: CreateAuditLogInput,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    try {
      await client.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          targetType: entry.targetType ?? null,
          targetId: entry.targetId ?? null,
          organizationId: entry.organizationId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          metadata: this.sanitizeMetadata(entry.metadata),
        },
      });
    } catch (error) {
      if (tx) {
        throw error;
      }
      this.logger.error(
        `Failed to record audit action "${entry.action}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async queryLogs(
    query: QueryAuditLogsDto,
    forcedOrganizationId?: string,
  ): Promise<
    PaginatedResult<{
      id: string;
      actorId: string | null;
      action: string;
      targetType: string | null;
      targetId: string | null;
      organizationId: string | null;
      ipAddress: string | null;
      userAgent: string | null;
      metadata: Prisma.JsonValue | null;
      createdAt: Date;
    }>
  > {
    const organizationId = forcedOrganizationId ?? query.organizationId;
    const where: Prisma.AuditLogWhereInput = {
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(organizationId ? { organizationId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        select: {
          id: true,
          actorId: true,
          action: true,
          targetType: true,
          targetId: true,
          organizationId: true,
          ipAddress: true,
          userAgent: true,
          metadata: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }
}
