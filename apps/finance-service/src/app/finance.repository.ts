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

  listEntries() {
    return this.prisma.financialEntry.findMany({
      include: {
        category: true,
        recordedBy: true,
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
    targetType?: FinancialTargetType;
    targetId?: string;
    targetName?: string;
    categoryId?: string;
    recordedById: string;
  }) {
    return this.prisma.financialEntry.create({ data });
  }

  listInvestments() {
    return this.prisma.investment.findMany({
      include: {
        recordedBy: true,
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

  listAllocations() {
    return this.prisma.allocation.findMany({
      include: {
        recordedBy: true,
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
      include: { category: true, recordedBy: true },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    });

    return {
      balance: totals.totalIncome - totals.totalExpense,
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      recentEntries,
    };
  }
}
