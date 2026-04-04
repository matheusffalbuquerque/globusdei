import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditType } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

/**
 * EmpreendimentoService
 * Encapsulates the Domain operations for the Globus Dei initiatives and projects.
 * Also strictly adheres to the LGPD Reviewer constraint.
 */
@Injectable()
export class EmpreendimentoService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findOne(id: string, requesterActorId: string) {
    const empreendimento = await this.prisma.empreendimento.findUnique({
      where: { id },
      include: { agents: true }, 
    });
    
    if (!empreendimento) {
      throw new NotFoundException(`Empreendimento ${id} not found.`);
    }

    await this.audit.logAction(
      requesterActorId,
      AuditType.AUDIT,
      `Visualização do empreendimento/iniciativa corporativa: ${empreendimento.name}`
    );

    return empreendimento;
  }

  async create(data: Prisma.EmpreendimentoCreateInput, requesterActorId: string) {
    const novo = await this.prisma.empreendimento.create({ data });
    
    await this.audit.logAction(
      requesterActorId,
      AuditType.TECHNICAL,
      `Nova iniciativa (empreendimento) configurada: ${novo.name}`
    );

    return novo;
  }
}
