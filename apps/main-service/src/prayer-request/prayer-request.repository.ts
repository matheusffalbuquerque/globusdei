import { Injectable } from '@nestjs/common';
import { PrayerRequestStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const AGENT_INCLUDE = {
  agent: { select: { id: true, name: true, email: true, city: true, country: true } },
  answeredBy: { select: { id: true, name: true } },
} as const;

@Injectable()
export class PrayerRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Todos os pedidos — pendentes primeiro (mais antigos no topo), depois atendidos */
  listAll() {
    return this.prisma.prayerRequest.findMany({
      orderBy: [
        { status: 'asc' },   // ANSWERED > PENDING alfabeticamente → invertido com sort no service
        { createdAt: 'asc' },
      ],
      include: AGENT_INCLUDE,
    });
  }

  /** Pedidos pendentes: mais antigos primeiro */
  listPending() {
    return this.prisma.prayerRequest.findMany({
      where: { status: PrayerRequestStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: AGENT_INCLUDE,
    });
  }

  /** Pedidos atendidos: mais recentes primeiro */
  listAnswered() {
    return this.prisma.prayerRequest.findMany({
      where: { status: PrayerRequestStatus.ANSWERED },
      orderBy: { answeredAt: 'desc' },
      include: AGENT_INCLUDE,
    });
  }

  /** Pedidos de um agente específico */
  listByAgent(agentId: string) {
    return this.prisma.prayerRequest.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      include: AGENT_INCLUDE,
    });
  }

  findById(id: string) {
    return this.prisma.prayerRequest.findUnique({
      where: { id },
      include: AGENT_INCLUDE,
    });
  }

  create(agentId: string, request: string) {
    return this.prisma.prayerRequest.create({
      data: { agentId, request },
      include: AGENT_INCLUDE,
    });
  }

  markAsAnswered(id: string, collaboratorId: string, internalNote?: string) {
    return this.prisma.prayerRequest.update({
      where: { id },
      data: {
        status: PrayerRequestStatus.ANSWERED,
        answeredById: collaboratorId,
        answeredAt: new Date(),
        internalNote: internalNote ?? null,
      },
      include: AGENT_INCLUDE,
    });
  }
}
