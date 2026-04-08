import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CollaboratorRole,
  FinancialEntryType,
  FinancialTargetType,
} from '@prisma/client';

import { AuthenticatedUser } from '../auth/user-context.interface';
import { FinanceRepository } from './finance.repository';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { CreateFinancialEntryDto } from './dto/create-financial-entry.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly finance: FinanceRepository) {}

  getDashboard() {
    return this.finance.getDashboard();
  }

  listAgents() {
    return this.finance.listAgents();
  }

  listEmpreendimentos() {
    return this.finance.listEmpreendimentos();
  }

  listEntries(filters?: { type?: FinancialEntryType; from?: string; to?: string }) {
    return this.finance.listEntries({
      type: filters?.type,
      from: filters?.from ? new Date(filters.from) : undefined,
      to: filters?.to ? new Date(filters.to) : undefined,
    });
  }

  async createEntry(user: AuthenticatedUser, dto: CreateFinancialEntryDto) {
    const collaborator = await this.ensureWriter(user);
    const targetName = dto.targetId
      ? await this.resolveTargetName(dto.targetType, dto.targetId)
      : dto.targetName;

    return this.finance.createEntry({
      type: dto.type,
      amount: dto.amount,
      description: dto.description,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      targetType: dto.targetType,
      targetId: dto.targetId,
      targetName,
      categoryId: dto.categoryId,
      recordedById: collaborator.id,
    });
  }

  async deleteEntry(user: AuthenticatedUser, id: string) {
    await this.ensureWriter(user);
    return this.finance.deleteEntry(id);
  }

  listCategories() {
    return this.finance.listCategories();
  }

  async createCategory(user: AuthenticatedUser, dto: CreateExpenseCategoryDto) {
    await this.ensureWriter(user);
    return this.finance.createCategory(dto.name, dto.description, dto.entryType ?? 'EXPENSE');
  }

  async deleteCategory(user: AuthenticatedUser, id: string) {
    await this.ensureWriter(user);
    return this.finance.deleteCategory(id);
  }

  listInvestments(filters?: { from?: string; to?: string }) {
    return this.finance.listInvestments({
      from: filters?.from ? new Date(filters.from) : undefined,
      to: filters?.to ? new Date(filters.to) : undefined,
    });
  }

  async createInvestment(user: AuthenticatedUser, dto: CreateInvestmentDto) {
    const collaborator = await this.ensureWriter(user);
    const targetName = await this.resolveTargetName(dto.targetType, dto.targetId);

    return this.finance.createInvestment({
      amount: dto.amount,
      description: dto.description,
      targetType: dto.targetType,
      targetId: dto.targetId,
      targetName,
      recordedById: collaborator.id,
    });
  }

  listAllocations(filters?: { from?: string; to?: string }) {
    return this.finance.listAllocations({
      from: filters?.from ? new Date(filters.from) : undefined,
      to: filters?.to ? new Date(filters.to) : undefined,
    });
  }

  async createAllocation(user: AuthenticatedUser, dto: CreateAllocationDto) {
    const collaborator = await this.ensureWriter(user);

    if (
      dto.targetType !== FinancialTargetType.AGENT &&
      dto.targetType !== FinancialTargetType.EMPREENDIMENTO
    ) {
      throw new BadRequestException(
        'Allocations must target an existing agent or empreendimento.',
      );
    }

    const targetName = await this.resolveTargetName(dto.targetType, dto.targetId);

    if (!targetName) {
      throw new BadRequestException('Allocations must target an existing agent or empreendimento.');
    }

    return this.finance.createAllocation({
      amount: dto.amount,
      description: dto.description,
      targetType: dto.targetType,
      targetId: dto.targetId,
      targetName,
      recordedById: collaborator.id,
    });
  }

  private async ensureWriter(user: AuthenticatedUser) {
    const collaborator = await this.finance.findCollaboratorByIdentity(user.sub, user.email);

    if (!collaborator) {
      throw new ForbiddenException('Missing local collaborator profile.');
    }

    const canWrite =
      collaborator.roles.includes(CollaboratorRole.ADMIN) ||
      collaborator.roles.includes(CollaboratorRole.RESOURCE_MANAGER);

    if (!canWrite) {
      throw new ForbiddenException('Only finance managers can register financial movements.');
    }

    return collaborator;
  }

  private async resolveTargetName(targetType?: FinancialTargetType, targetId?: string) {
    if (!targetType || targetType === 'ORGANIZATION') {
      return 'Globus Dei';
    }

    if (!targetId) {
      throw new BadRequestException('A target id is required for AGENT and EMPREENDIMENTO targets.');
    }

    if (targetType === 'AGENT') {
      const agent = await this.finance.findAgent(targetId);
      if (!agent) {
        throw new NotFoundException('Target agent not found.');
      }

      return agent.name;
    }

    const empreendimento = await this.finance.findEmpreendimento(targetId);

    if (!empreendimento) {
      throw new NotFoundException('Target empreendimento not found.');
    }

    return empreendimento.name;
  }
}
