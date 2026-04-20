import { Injectable } from '@nestjs/common';
import {
  FinancialEntryType,
  FinancialTargetType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCollaboratorByIdentity(sub: string, email: string) {
    return this.prisma.collaborator.findFirst({
      where: {
        OR: [{ authSubject: sub }, { email }],
      },
    });
  }

  findAgent(id: string) {
    return this.prisma.agent.findUnique({ where: { id } });
  }

  findEmpreendimento(id: string) {
    return this.prisma.empreendimento.findUnique({ where: { id } });
  }

  listAgents() {
    return this.prisma.agent.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, city: true, country: true },
      orderBy: { name: 'asc' },
    });
  }

  listEmpreendimentos() {
    return this.prisma.empreendimento.findMany({
      select: { id: true, name: true, type: true, category: true, location: true },
      orderBy: { name: 'asc' },
    });
  }

  listCategories() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  createCategory(name: string, description?: string, entryType: FinancialEntryType = 'EXPENSE') {
    return this.prisma.expenseCategory.create({
      data: { name, description, entryType },
    });
  }

  deleteCategory(id: string) {
    return this.prisma.expenseCategory.delete({ where: { id } });
  }

  listEntries(filters?: { type?: FinancialEntryType; from?: Date; to?: Date; targetId?: string }) {
    return this.prisma.financialEntry.findMany({
      where: {
        ...(filters?.type ? { type: filters.type } : {}),
        ...(filters?.targetId ? { targetId: filters.targetId } : {}),
        ...(filters?.from || filters?.to
          ? {
              occurredAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      include: {
        category: true,
        recordedBy: { select: { id: true, name: true } },
        investment: true,
        allocation: true,
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  createEntry(data: {
    type: FinancialEntryType;
    amount: number;
    description: string;
    occurredAt?: Date;
    targetType?: FinancialTargetType;
    targetId?: string;
    targetName?: string;
    categoryId?: string;
    recordedById: string;
  }) {
    return this.prisma.financialEntry.create({ data });
  }

  deleteEntry(id: string) {
    return this.prisma.financialEntry.delete({ where: { id } });
  }

  updateEntry(
    id: string,
    data: Partial<{
      type: FinancialEntryType;
      amount: number;
      description: string;
      occurredAt: Date;
      categoryId: string | null;
    }>,
  ) {
    return this.prisma.financialEntry.update({ where: { id }, data });
  }

  listInvestments(filters?: { from?: Date; to?: Date }) {
    return this.prisma.investment.findMany({
      where:
        filters?.from || filters?.to
          ? {
              createdAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : undefined,
      include: {
        recordedBy: { select: { id: true, name: true } },
        financialEntry: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createInvestment(data: {
    amount: number;
    description?: string;
    targetType: FinancialTargetType;
    targetId?: string;
    targetName?: string;
    recordedById: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const investment = await tx.investment.create({ data });
      const entry = await tx.financialEntry.create({
        data: {
          type: 'INCOME',
          amount: data.amount,
          description: data.description ?? 'Investimento registrado',
          targetType: data.targetType,
          targetId: data.targetId,
          targetName: data.targetName,
          recordedById: data.recordedById,
          investmentId: investment.id,
        },
      });

      return { investment, entry };
    });
  }

  listAllocations(filters?: { from?: Date; to?: Date }) {
    return this.prisma.allocation.findMany({
      where:
        filters?.from || filters?.to
          ? {
              createdAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : undefined,
      include: {
        recordedBy: { select: { id: true, name: true } },
        financialEntry: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createAllocation(data: {
    amount: number;
    description?: string;
    targetType: FinancialTargetType;
    targetId: string;
    targetName: string;
    recordedById: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const allocation = await tx.allocation.create({ data });
      const entry = await tx.financialEntry.create({
        data: {
          type: 'EXPENSE',
          amount: data.amount,
          description: data.description ?? 'Repasse registrado',
          targetType: data.targetType,
          targetId: data.targetId,
          targetName: data.targetName,
          recordedById: data.recordedById,
          allocationId: allocation.id,
        },
      });

      return { allocation, entry };
    });
  }

  async getDashboard() {
    const entries = await this.prisma.financialEntry.findMany();

    const totals = entries.reduce(
      (accumulator, entry) => {
        if (entry.type === 'INCOME' || entry.type === 'ADJUSTMENT') {
          accumulator.totalIncome += entry.amount;
        }

        if (entry.type === 'EXPENSE' || entry.type === 'TRANSFER') {
          accumulator.totalExpense += entry.amount;
        }

        return accumulator;
      },
      { totalIncome: 0, totalExpense: 0 },
    );

    const recentEntries = await this.prisma.financialEntry.findMany({
      include: { category: true, recordedBy: { select: { id: true, name: true } } },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    });

    // Agrupamento por mês (últimos 6 meses) para gráfico
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEntries = await this.prisma.financialEntry.findMany({
      where: { occurredAt: { gte: sixMonthsAgo } },
      orderBy: { occurredAt: 'asc' },
    });

    const monthlyMap: Record<string, { income: number; expense: number }> = {};
    for (const entry of monthlyEntries) {
      const key = entry.occurredAt.toISOString().slice(0, 7); // "YYYY-MM"
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
      if (entry.type === 'INCOME' || entry.type === 'ADJUSTMENT') {
        monthlyMap[key].income += entry.amount;
      } else {
        monthlyMap[key].expense += entry.amount;
      }
    }

    const monthlyChart = Object.entries(monthlyMap).map(([month, values]) => ({
      month,
      ...values,
    }));

    return {
      balance: totals.totalIncome - totals.totalExpense,
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      recentEntries,
      monthlyChart,
    };
  }
}
