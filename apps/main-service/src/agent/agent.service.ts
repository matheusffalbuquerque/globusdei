import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditType } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

/**
 * AgentService
 * Encapsulates operations over the "Agent" domain: Missionaries, Students, and Leaders.
 * Adheres strictly to the LGPD Reviewer constraint by logging sensitive data accesses.
 */
@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Retrieves an Agent profile. Includes an audit log trail as agent data may contain PII.
   */
  async findOne(id: string, requesterActorId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { empreendimentos: true },
    });
    
    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found.`);
    }

    // Required by Reviewer LGPD constraint
    await this.audit.logAction(
      requesterActorId,
      AuditType.AUDIT,
      `Visualização de dados sensíveis do agente: ${agent.name}`
    );

    return agent;
  }

  /**
   * Register a new agent into the ecosystem.
   */
  async create(data: Prisma.AgentCreateInput, requesterActorId: string) {
    const newAgent = await this.prisma.agent.create({ data });
    
    await this.audit.logAction(
      requesterActorId,
      AuditType.TECHNICAL,
      `Novo agente cadastrado: ${newAgent.email}`
    );

    return newAgent;
  }
}
