import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CollaboratorRole, OpportunityCategory } from '@prisma/client';

import { AgentRepository } from '../agent/agent.repository';
import { AuditService, AuditType } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CollaboratorRepository } from '../collaborator/collaborator.repository';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunityRepository } from './opportunity.repository';

@Injectable()
export class OpportunityService {
  constructor(
    private readonly opportunities: OpportunityRepository,
    private readonly agents: AgentRepository,
    private readonly collaborators: CollaboratorRepository,
    private readonly audit: AuditService,
  ) {}

  /** Lista oportunidades publicadas (agentes e público). */
  listPublished(category?: OpportunityCategory, search?: string) {
    return this.opportunities.listPublished(category, search);
  }

  /** Lista todas as oportunidades (colaboradores, inclui não publicadas). */
  listAll(category?: OpportunityCategory, search?: string) {
    return this.opportunities.listAll(category, search);
  }

  /** Detalhe de uma oportunidade pública. */
  async findOne(id: string) {
    const opportunity = await this.opportunities.findById(id);
    if (!opportunity || !opportunity.isPublished) {
      throw new NotFoundException('Oportunidade não encontrada.');
    }
    return opportunity;
  }

  /** Detalhe de uma oportunidade (colaboradores veem qualquer status). */
  async findOneAsCollaborator(id: string) {
    const opportunity = await this.opportunities.findById(id);
    if (!opportunity) {
      throw new NotFoundException('Oportunidade não encontrada.');
    }
    return opportunity;
  }

  /** Criação por colaborador. */
  async createByCollaborator(user: AuthenticatedUser, dto: CreateOpportunityDto) {
    const collaborator = await this.collaborators.findBySubjectOrEmail(user.sub, user.email);
    if (!collaborator) {
      throw new ForbiddenException('Perfil de colaborador não encontrado.');
    }

    const opportunity = await this.opportunities.createByCollaborator(collaborator.id, dto);

    await this.audit.logAction(
      collaborator.id,
      AuditType.TECHNICAL,
      `Criação da oportunidade ${opportunity.id}.`,
    );

    return opportunity;
  }

  /**
   * Criação por agente — somente agentes APPROVED que possuem ao menos um empreendimento.
   */
  async createByAgent(user: AuthenticatedUser, dto: CreateOpportunityDto) {
    const agent = await this.agents.findBySubjectOrEmail(user.sub, user.email);
    if (!agent) {
      throw new ForbiddenException('Perfil de agente não encontrado.');
    }

    if (agent.status !== 'APPROVED') {
      throw new ForbiddenException(
        'Somente agentes aprovados com iniciativas podem publicar oportunidades.',
      );
    }

    // Verifica se o agente é dono ou gerente de algum empreendimento
    const hasEmpreendimento = await this.hasActiveEmpreendimento(agent.id);
    if (!hasEmpreendimento) {
      throw new ForbiddenException(
        'Você precisa ser responsável por uma iniciativa para publicar oportunidades.',
      );
    }

    const opportunity = await this.opportunities.createByAgent(agent.id, dto);

    await this.audit.logAction(
      agent.id,
      AuditType.TECHNICAL,
      `Criação da oportunidade ${opportunity.id} pelo agente.`,
    );

    return opportunity;
  }

  /** Edição — colaboradores ou o agente autor. */
  async update(id: string, user: AuthenticatedUser, dto: UpdateOpportunityDto) {
    const existing = await this.opportunities.findById(id);
    if (!existing) {
      throw new NotFoundException('Oportunidade não encontrada.');
    }

    const isCollaborator = user.realmRoles?.includes('colaborador') ||
      user.realmRoles?.includes('administrador');

    if (!isCollaborator) {
      const agent = await this.agents.findBySubjectOrEmail(user.sub, user.email);
      if (!agent || existing.authorAgentId !== agent.id) {
        throw new ForbiddenException('Você não tem permissão para editar esta oportunidade.');
      }
    }

    const updated = await this.opportunities.update(id, dto);

    await this.audit.logAction(
      user.sub,
      AuditType.TECHNICAL,
      `Edição da oportunidade ${id}.`,
    );

    return updated;
  }

  /** Remoção — somente colaboradores (ADMIN ou PROJECT_MANAGER). */
  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.opportunities.findById(id);
    if (!existing) {
      throw new NotFoundException('Oportunidade não encontrada.');
    }

    await this.opportunities.delete(id);

    await this.audit.logAction(
      user.sub,
      AuditType.SECURITY,
      `Remoção da oportunidade ${id}.`,
    );
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async hasActiveEmpreendimento(agentId: string): Promise<boolean> {
    const agent = await this.agents.findById(agentId);
    if (!agent) return false;

    return agent.empreendimentos.some(
      (m) => m.role === 'OWNER' || m.role === 'MANAGER',
    );
  }
}
