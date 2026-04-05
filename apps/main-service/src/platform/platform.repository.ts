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
