import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';

@Injectable()
export class AgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.agent.findUnique({
      where: { id },
      include: {
        empreendimentos: {
          include: { empreendimento: true },
        },
      },
    });
  }

  findBySubjectOrEmail(authSubject: string, email: string) {
    return this.prisma.agent.findFirst({
      where: {
        OR: [{ authSubject }, { email }],
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.agent.findUnique({
      where: { slug }
    });
  }

  async upsertFromIdentity(params: {
    authSubject: string;
    email: string;
    name: string;
  }) {
    const existing = await this.findBySubjectOrEmail(params.authSubject, params.email);

    if (existing) {
      return this.prisma.agent.update({
        where: { id: existing.id },
        data: {
          authSubject: params.authSubject,
          email: params.email,
          name: params.name,
        },
      });
    }

    return this.prisma.agent.create({
      data: {
        authSubject: params.authSubject,
        email: params.email,
        name: params.name,
        vocationType: 'Não informado',
        description: 'Perfil criado automaticamente a partir da autenticação.',
      },
    });
  }

  updateProfile(id: string, data: UpdateAgentProfileDto) {
    return this.prisma.agent.update({
      where: { id },
      data,
    });
  }

  getDashboard(agentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const [connections, following, announcements, serviceRequests, empreendimentos] =
        await Promise.all([
          tx.connection.count({
            where: {
              OR: [
                { senderId: agentId, status: 'ACCEPTED' },
                { receiverId: agentId, status: 'ACCEPTED' },
              ],
            },
          }),
          tx.empreendimentoFollow.count({ where: { agentId } }),
          tx.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          tx.serviceRequest.findMany({
            where: { agentId },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          tx.empreendimentoMember.findMany({
            where: { agentId },
            include: { empreendimento: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
        ]);

      return {
        connections,
        following,
        announcements,
        serviceRequests,
        empreendimentos: empreendimentos.map((member) => member.empreendimento),
      };
    });
  }
}
