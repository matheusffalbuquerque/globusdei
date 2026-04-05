import { Injectable } from '@nestjs/common';
import { EmpreendimentoAgentRole, InviteStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEmpreendimentoDto } from './dto/create-empreendimento.dto';
import { UpdateEmpreendimentoDto } from './dto/update-empreendimento.dto';
import { UpdateEmpreendimentoInternalDto } from './dto/update-empreendimento-internal.dto';

@Injectable()
export class EmpreendimentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.empreendimento.findMany({
      include: {
        agents: {
          include: { agent: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findMine(agentId: string) {
    return this.prisma.empreendimento.findMany({
      where: {
        agents: {
          some: { agentId },
        },
      },
      include: {
        agents: {
          include: { agent: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.empreendimento.findUnique({
      where: { id },
      include: {
        owner: true,
        internalResponsible: true,
        agents: {
          include: { agent: true },
        },
        invites: {
          orderBy: { createdAt: 'desc' },
        },
        serviceLogs: {
          include: { collaborator: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  create(ownerId: string, dto: CreateEmpreendimentoDto) {
    return this.prisma.empreendimento.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
        establishedDate: new Date(dto.establishedDate),
        type: dto.type,
        category: dto.category,
        socialLinks: dto.socialLinks,
        portfolioUrl: dto.portfolioUrl,
        location: dto.location,
        actuationRegions: dto.actuationRegions,
        logoUrl: dto.logoUrl,
        bannerUrl: dto.bannerUrl,
        monthlyExpenses: dto.monthlyExpenses ?? 0,
        incomeSources: dto.incomeSources,
        needType: dto.needType ?? 'MAINTENANCE',
        receivesInvestments: dto.receivesInvestments ?? false,
        agents: {
          create: {
            agentId: ownerId,
            role: EmpreendimentoAgentRole.OWNER,
          },
        },
      },
      include: {
        agents: true,
      },
    });
  }

  update(id: string, dto: UpdateEmpreendimentoDto, encryptedBankDetails?: string | null) {
    const data = {
      ...dto,
      establishedDate: dto.establishedDate ? new Date(dto.establishedDate) : undefined,
      bankDetails: encryptedBankDetails === undefined ? undefined : encryptedBankDetails,
    };

    return this.prisma.empreendimento.update({
      where: { id },
      data,
    });
  }

  updateInternal(id: string, collaboratorId: string, dto: UpdateEmpreendimentoInternalDto) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.empreendimento.update({
        where: { id },
        data: {
          ...dto,
          internalResponsibleId: collaboratorId,
        },
      });

      await tx.serviceLog.create({
        data: {
          empreendimentoId: id,
          collaboratorId,
          action: 'INTERNAL_UPDATE',
          content: JSON.stringify(dto),
        },
      });

      return updated;
    });
  }

  getMembership(empreendimentoId: string, agentId: string) {
    return this.prisma.empreendimentoMember.findUnique({
      where: {
        agentId_empreendimentoId: { agentId, empreendimentoId },
      },
    });
  }

  listMembers(empreendimentoId: string) {
    return this.prisma.empreendimentoMember.findMany({
      where: { empreendimentoId },
      include: { agent: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  listInvitesByEmail(email: string) {
    return this.prisma.empreendimentoInvite.findMany({
      where: { email, status: InviteStatus.PENDING },
      include: { empreendimento: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createInvite(params: {
    empreendimentoId: string;
    inviterId: string;
    email: string;
    role: EmpreendimentoAgentRole;
    token: string;
  }) {
    return this.prisma.empreendimentoInvite.create({
      data: params,
    });
  }

  findInviteByToken(token: string) {
    return this.prisma.empreendimentoInvite.findUnique({
      where: { token },
    });
  }

  acceptInvite(inviteId: string, empreendimentoId: string, agentId: string, role: EmpreendimentoAgentRole) {
    return this.prisma.$transaction(async (tx) => {
      await tx.empreendimentoMember.upsert({
        where: {
          agentId_empreendimentoId: { agentId, empreendimentoId },
        },
        update: { role },
        create: {
          agentId,
          empreendimentoId,
          role,
        },
      });

      return tx.empreendimentoInvite.update({
        where: { id: inviteId },
        data: { status: InviteStatus.ACCEPTED },
      });
    });
  }
}
