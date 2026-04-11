import { Injectable } from '@nestjs/common';
import { ServiceRequestCategory, ServiceRequestStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEmpreendimento(id: string) {
    return this.prisma.empreendimento.findUnique({ where: { id } });
  }

  findFollow(agentId: string, empreendimentoId: string) {
    return this.prisma.empreendimentoFollow.findUnique({
      where: {
        agentId_empreendimentoId: { agentId, empreendimentoId },
      },
    });
  }

  follow(agentId: string, empreendimentoId: string) {
    return this.prisma.empreendimentoFollow.create({
      data: { agentId, empreendimentoId },
    });
  }

  unfollow(agentId: string, empreendimentoId: string) {
    return this.prisma.empreendimentoFollow.delete({
      where: {
        agentId_empreendimentoId: { agentId, empreendimentoId },
      },
    });
  }

  getFollowing(agentId: string) {
    return this.prisma.empreendimentoFollow.findMany({
      where: { agentId },
      include: { empreendimento: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Todos os empreendimentos com flag `isFollowing` para o agente */
  async listAllWithFollowStatus(agentId: string) {
    const [empreendimentos, follows] = await Promise.all([
      this.prisma.empreendimento.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true, description: true, type: true, category: true,
          location: true, logoUrl: true,
          _count: { select: { followers: true } },
        },
      }),
      this.prisma.empreendimentoFollow.findMany({
        where: { agentId },
        select: { empreendimentoId: true },
      }),
    ]);
    const followedIds = new Set(follows.map((f) => f.empreendimentoId));
    return empreendimentos.map((e) => ({ ...e, isFollowing: followedIds.has(e.id) }));
  }

  createServiceRequest(agentId: string, category: ServiceRequestCategory, description: string) {
    return this.prisma.serviceRequest.create({
      data: {
        agentId,
        category,
        description,
      },
    });
  }

  listServiceRequestsForAgent(agentId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listServiceRequestsForCollaborators() {
    return this.prisma.serviceRequest.findMany({
      include: { agent: true, assignedCollaborator: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateServiceRequest(id: string, status: ServiceRequestStatus, internalNotes?: string, assignedCollaboratorId?: string) {
    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status,
        internalNotes,
        assignedCollaboratorId,
      },
    });
  }
}
