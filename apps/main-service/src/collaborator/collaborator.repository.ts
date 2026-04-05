import { Injectable } from '@nestjs/common';
import { CollaboratorRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollaboratorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySubjectOrEmail(authSubject: string, email: string) {
    return this.prisma.collaborator.findFirst({
      where: {
        OR: [{ authSubject }, { email }],
      },
    });
  }

  async upsertFromIdentity(params: {
    authSubject: string;
    email: string;
    name: string;
    roles: CollaboratorRole[];
  }) {
    const existing = await this.findBySubjectOrEmail(params.authSubject, params.email);

    if (existing) {
      return this.prisma.collaborator.update({
        where: { id: existing.id },
        data: {
          authSubject: params.authSubject,
          email: params.email,
          name: params.name,
        },
      });
    }

    return this.prisma.collaborator.create({
      data: {
        authSubject: params.authSubject,
        email: params.email,
        name: params.name,
        roles: params.roles,
        expertiseAreas: [],
      },
    });
  }

  listAll() {
    return this.prisma.collaborator.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  updateRoles(id: string, roles: CollaboratorRole[]) {
    return this.prisma.collaborator.update({
      where: { id },
      data: { roles },
    });
  }

  getDashboard(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const [pendingAgents, managedEmpreendimentos, openRequests, totalAnnouncements] =
        await Promise.all([
          tx.agent.count({ where: { status: { in: ['SUBMITTED', 'QUALIFIED', 'SCHEDULED'] } } }),
          tx.empreendimento.count({ where: { internalResponsibleId: id } }),
          tx.serviceRequest.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
          tx.announcement.count(),
        ]);

      return {
        pendingAgents,
        managedEmpreendimentos,
        openRequests,
        totalAnnouncements,
      };
    });
  }
}
