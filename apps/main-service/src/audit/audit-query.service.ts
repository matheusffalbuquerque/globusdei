import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listLogs(filters: ListAuditLogsDto) {
    const { startDate, endDate, actorId, actorName, actionType, entity, search, page = 1, limit = 50 } = filters;

    const where: Prisma.AuditLogWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Prisma.DateTimeFilter).lte = end;
      }
    }

    if (actorId) where.actorId = actorId;
    if (actionType) where.actionType = actionType;
    if (entity) where.entity = { contains: entity, mode: 'insensitive' };

    if (actorName) {
      where.actorName = { contains: actorName, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { actionDetail: { contains: search, mode: 'insensitive' } },
        { actorName: { contains: search, mode: 'insensitive' } },
        { actorEmail: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          actorId: true,
          actorName: true,
          actorEmail: true,
          entity: true,
          actionType: true,
          actionDetail: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const [total, byType, byEntity, recent] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.groupBy({ by: ['actionType'], _count: { _all: true } }),
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        _count: { _all: true },
        where: { entity: { not: null } },
        orderBy: { _count: { entity: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, actorName: true, actionDetail: true, actionType: true, createdAt: true },
      }),
    ]);

    return {
      total,
      byType: byType.map((r) => ({ type: r.actionType, count: r._count._all })),
      byEntity: byEntity.map((r) => ({ entity: r.entity, count: r._count._all })),
      recent,
    };
  }
}
