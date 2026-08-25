import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ListAuditLogsQuery } from '../../schemas/admin/platform.schema.js';

export interface CreateAuditLogParams {
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null | undefined;
  details?: Record<string, unknown> | null | undefined;
  ipAddress?: string | null | undefined;
}

export const auditService = {
  /**
   * Centralized append-only helper to record administrative actions.
   * Can execute within an existing Prisma transaction client or standalone.
   */
  async createAuditLog(
    tx: Prisma.TransactionClient | typeof prisma,
    params: CreateAuditLogParams
  ) {
    return tx.adminAuditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId ?? null,
        details: (params.details as Prisma.InputJsonValue) ?? Prisma.DbNull,
        ipAddress: params.ipAddress ?? null,
      },
    });
  },

  /**
   * Paginated audit log retrieval with search and filters.
   * Safely projects actor information with zero password/token leaks.
   */
  async listAuditLogs(query: ListAuditLogsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AdminAuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { targetType: { contains: query.search, mode: 'insensitive' } },
        { targetId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: {
            select: {
              id: true,
              email: true,
              role: true,
              adminProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                  permissionsLevel: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
