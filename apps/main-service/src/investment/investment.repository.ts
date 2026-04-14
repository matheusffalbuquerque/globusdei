import { Injectable } from '@nestjs/common';
import { AgentInvestmentTargetType, AgentInvestmentType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';

const INVESTOR_INCLUDE = {
  investor: { select: { id: true, name: true, email: true, city: true, country: true } },
  targetAgent: { select: { id: true, name: true, email: true, city: true, country: true } },
  targetEmpreendimento: { select: { id: true, name: true, type: true, category: true, location: true } },
} as const;

@Injectable()
export class InvestmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Listagem geral (colaboradores) ────────────────────────────────────────

  async listAll(opts?: {
    targetType?: AgentInvestmentTargetType;
    type?: AgentInvestmentType;
    investorId?: string;
    targetId?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (opts?.targetType) where['targetType'] = opts.targetType;
    if (opts?.type)        where['type']       = opts.type;
    if (opts?.investorId)  where['investorId'] = opts.investorId;
    if (opts?.targetId) {
      where['OR'] = [
        { targetAgentId: opts.targetId },
        { targetEmpreendimentoId: opts.targetId },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.agentInvestment.count({ where }),
      this.prisma.agentInvestment.findMany({
        where,
        include: INVESTOR_INCLUDE,
        orderBy: { investedAt: 'desc' },
        skip: opts?.skip ?? 0,
        take: opts?.take ?? 50,
      }),
    ]);

    return { total, items };
  }

  // ── Por investidor (carteira do agente) ──────────────────────────────────

  async listByInvestor(investorId: string) {
    return this.prisma.agentInvestment.findMany({
      where: { investorId },
      include: INVESTOR_INCLUDE,
      orderBy: { investedAt: 'desc' },
    });
  }

  // ── Recebidos por alvo ───────────────────────────────────────────────────

  async listByTarget(targetId: string, targetType: AgentInvestmentTargetType) {
    const where =
      targetType === AgentInvestmentTargetType.AGENT
        ? { targetAgentId: targetId }
        : { targetEmpreendimentoId: targetId };

    return this.prisma.agentInvestment.findMany({
      where,
      include: INVESTOR_INCLUDE,
      orderBy: { investedAt: 'desc' },
    });
  }

  // ── Por ID ───────────────────────────────────────────────────────────────

  async findById(id: string) {
    return this.prisma.agentInvestment.findUnique({
      where: { id },
      include: INVESTOR_INCLUDE,
    });
  }

  // ── Criar ─────────────────────────────────────────────────────────────────

  async create(investorId: string, dto: CreateInvestmentDto) {
    return this.prisma.agentInvestment.create({
      data: {
        investorId,
        targetType: dto.targetType,
        targetAgentId: dto.targetAgentId ?? null,
        targetEmpreendimentoId: dto.targetEmpreendimentoId ?? null,
        amount: dto.amount,
        type: dto.type ?? AgentInvestmentType.ONE_TIME,
        notes: dto.notes ?? null,
      },
      include: INVESTOR_INCLUDE,
    });
  }

  // ── Deletar ───────────────────────────────────────────────────────────────

  async delete(id: string) {
    return this.prisma.agentInvestment.delete({ where: { id } });
  }

  // ── Métricas ─────────────────────────────────────────────────────────────

  async summaryByInvestor(investorId: string) {
    const items = await this.prisma.agentInvestment.findMany({
      where: { investorId },
      select: { amount: true, type: true, targetType: true, investedAt: true },
    });

    const total = items.reduce((s, i) => s + i.amount, 0);
    const recurring = items.filter((i) => i.type === AgentInvestmentType.RECURRING);
    const monthlyRecurring = recurring.reduce((s, i) => s + i.amount, 0);
    const countByTargetType = {
      agent: items.filter((i) => i.targetType === AgentInvestmentTargetType.AGENT).length,
      empreendimento: items.filter((i) => i.targetType === AgentInvestmentTargetType.EMPREENDIMENTO).length,
    };

    return {
      totalInvested: total,
      totalTransactions: items.length,
      monthlyRecurring,
      countByTargetType,
    };
  }

  // ── Empreendimentos pertencentes ao agente ────────────────────────────────

  async listEmpreendimentosByOwner(agentId: string) {
    return this.prisma.empreendimento.findMany({
      where: { ownerId: agentId },
      select: { id: true, name: true, type: true },
    });
  }

  async summaryByTarget(targetId: string, targetType: AgentInvestmentTargetType) {
    const where =
      targetType === AgentInvestmentTargetType.AGENT
        ? { targetAgentId: targetId }
        : { targetEmpreendimentoId: targetId };

    const items = await this.prisma.agentInvestment.findMany({
      where,
      select: { amount: true, type: true, investorId: true },
    });

    const total = items.reduce((s, i) => s + i.amount, 0);
    const uniqueInvestors = new Set(items.map((i) => i.investorId)).size;
    const recurring = items.filter((i) => i.type === AgentInvestmentType.RECURRING);
    const monthlyRecurring = recurring.reduce((s, i) => s + i.amount, 0);

    return {
      totalReceived: total,
      totalTransactions: items.length,
      uniqueInvestors,
      monthlyRecurring,
    };
  }
}
