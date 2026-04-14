import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentInvestmentTargetType, AgentInvestmentType } from '@prisma/client';

import { AgentRepository } from '../agent/agent.repository';
import { AuditService, AuditType } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CollaboratorRepository } from '../collaborator/collaborator.repository';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { InvestmentRepository } from './investment.repository';

@Injectable()
export class InvestmentService {
  constructor(
    private readonly investments: InvestmentRepository,
    private readonly agents: AgentRepository,
    private readonly collaborators: CollaboratorRepository,
    private readonly audit: AuditService,
  ) {}

  // ── Colaborador: listagem com filtros ────────────────────────────────────

  listAll(
    targetType?: AgentInvestmentTargetType,
    type?: AgentInvestmentType,
    investorId?: string,
    targetId?: string,
    skip?: number,
    take?: number,
  ) {
    return this.investments.listAll({ targetType, type, investorId, targetId, skip, take });
  }

  // ── Agente: carteira pessoal ─────────────────────────────────────────────

  async getWallet(user: AuthenticatedUser) {
    const agent = await this.agents.findBySubjectOrEmail(user.sub, user.email);
    if (!agent) throw new NotFoundException('Agente não encontrado.');

    const [items, summary] = await Promise.all([
      this.investments.listByInvestor(agent.id),
      this.investments.summaryByInvestor(agent.id),
    ]);

    return { investor: { id: agent.id, name: agent.name }, summary, items };
  }

  // ── Recebidos pelo agente autenticado ────────────────────────────────────

  async getReceivedByAgent(user: AuthenticatedUser) {
    const agent = await this.agents.findBySubjectOrEmail(user.sub, user.email);
    if (!agent) throw new NotFoundException('Agente não encontrado.');

    if (agent.status !== 'APPROVED') {
      throw new ForbiddenException('Apenas agentes aprovados podem receber investimentos.');
    }

    const [items, summary] = await Promise.all([
      this.investments.listByTarget(agent.id, AgentInvestmentTargetType.AGENT),
      this.investments.summaryByTarget(agent.id, AgentInvestmentTargetType.AGENT),
    ]);

    return { target: { id: agent.id, name: agent.name }, summary, items };
  }

  // ── Recebidos por empreendimentos do agente autenticado ──────────────────

  async getReceivedByMyEmpreendimentos(user: AuthenticatedUser) {
    const agent = await this.agents.findBySubjectOrEmail(user.sub, user.email);
    if (!agent) throw new NotFoundException('Agente não encontrado.');

    const empreendimentos = await this.investments.listEmpreendimentosByOwner(agent.id);

    const results = await Promise.all(
      empreendimentos.map(async (emp: { id: string; name: string; type: string }) => {
        const [items, summary] = await Promise.all([
          this.investments.listByTarget(emp.id, AgentInvestmentTargetType.EMPREENDIMENTO),
          this.investments.summaryByTarget(emp.id, AgentInvestmentTargetType.EMPREENDIMENTO),
        ]);
        return { empreendimento: emp, summary, items };
      }),
    );

    return results;
  }

  // ── Recebidos por empreendimento ─────────────────────────────────────────

  async getReceivedByEmpreendimento(empreendimentoId: string, user: AuthenticatedUser) {
    const [items, summary] = await Promise.all([
      this.investments.listByTarget(empreendimentoId, AgentInvestmentTargetType.EMPREENDIMENTO),
      this.investments.summaryByTarget(empreendimentoId, AgentInvestmentTargetType.EMPREENDIMENTO),
    ]);

    return { targetId: empreendimentoId, summary, items };
  }

  // ── Criar investimento (agente investindo) ───────────────────────────────

  async create(user: AuthenticatedUser, dto: CreateInvestmentDto) {
    const agent = await this.agents.findBySubjectOrEmail(user.sub, user.email);
    if (!agent) throw new NotFoundException('Agente não encontrado.');

    if (agent.status !== 'APPROVED') {
      throw new ForbiddenException('Apenas agentes aprovados podem registrar investimentos.');
    }

    // Validação cruzada do alvo
    if (dto.targetType === AgentInvestmentTargetType.AGENT && !dto.targetAgentId) {
      throw new ForbiddenException('Informe o ID do agente alvo.');
    }
    if (dto.targetType === AgentInvestmentTargetType.EMPREENDIMENTO && !dto.targetEmpreendimentoId) {
      throw new ForbiddenException('Informe o ID do empreendimento alvo.');
    }

    const investment = await this.investments.create(agent.id, dto);

    await this.audit.logAction(
      agent.id,
      AuditType.TECHNICAL,
      `Agente ${agent.id} registrou investimento ${investment.id} de R$ ${dto.amount}.`,
    );

    return investment;
  }

  // ── Detalhe por ID ───────────────────────────────────────────────────────

  async findOne(id: string) {
    const inv = await this.investments.findById(id);
    if (!inv) throw new NotFoundException('Investimento não encontrado.');
    return inv;
  }

  // ── Deletar (colaborador admin) ──────────────────────────────────────────

  async remove(id: string, user: AuthenticatedUser) {
    const inv = await this.investments.findById(id);
    if (!inv) throw new NotFoundException('Investimento não encontrado.');

    const collaborator = await this.collaborators.findBySubjectOrEmail(user.sub, user.email);
    if (!collaborator) throw new ForbiddenException('Acesso negado.');

    await this.audit.logAction(
      collaborator.id,
      AuditType.TECHNICAL,
      `Colaborador ${collaborator.id} removeu investimento ${id}.`,
    );

    return this.investments.delete(id);
  }
}
