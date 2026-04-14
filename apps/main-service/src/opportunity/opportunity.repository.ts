import { Injectable } from '@nestjs/common';
import { OpportunityCategory } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

const OPPORTUNITY_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  location: true,
  isRemote: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  authorCollaboratorId: true,
  authorAgentId: true,
  empreendimentoId: true,
  authorCollaborator: { select: { id: true, name: true } },
  authorAgent: { select: { id: true, name: true } },
  empreendimento: { select: { id: true, name: true } },
};

@Injectable()
export class OpportunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPublished(category?: OpportunityCategory, search?: string) {
    return this.prisma.opportunity.findMany({
      where: {
        isPublished: true,
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: OPPORTUNITY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  listAll(category?: OpportunityCategory, search?: string) {
    return this.prisma.opportunity.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: OPPORTUNITY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.opportunity.findUnique({
      where: { id },
      select: OPPORTUNITY_SELECT,
    });
  }

  createByCollaborator(collaboratorId: string, dto: CreateOpportunityDto) {
    return this.prisma.opportunity.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category ?? 'OTHER',
        location: dto.location,
        isRemote: dto.isRemote ?? false,
        authorCollaboratorId: collaboratorId,
        empreendimentoId: dto.empreendimentoId,
      },
      select: OPPORTUNITY_SELECT,
    });
  }

  createByAgent(agentId: string, dto: CreateOpportunityDto) {
    return this.prisma.opportunity.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category ?? 'OTHER',
        location: dto.location,
        isRemote: dto.isRemote ?? false,
        authorAgentId: agentId,
        empreendimentoId: dto.empreendimentoId,
      },
      select: OPPORTUNITY_SELECT,
    });
  }

  update(id: string, dto: UpdateOpportunityDto) {
    return this.prisma.opportunity.update({
      where: { id },
      data: dto,
      select: OPPORTUNITY_SELECT,
    });
  }

  delete(id: string) {
    return this.prisma.opportunity.delete({ where: { id } });
  }

  findOwnerAgent(id: string) {
    return this.prisma.opportunity.findUnique({
      where: { id },
      select: { authorAgentId: true, authorCollaboratorId: true },
    });
  }
}
