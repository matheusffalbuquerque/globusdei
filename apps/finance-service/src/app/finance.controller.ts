import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole, FinancialEntryType } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireCollaboratorRoles, RequireRealmRoles } from '../auth/role.decorators';
import { AuthenticatedUser } from '../auth/user-context.interface';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { CreateFinancialEntryDto } from './dto/create-financial-entry.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('colaborador', 'administrador')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('dashboard')
  getDashboard() {
    return this.finance.getDashboard();
  }

  // ── Targets (para popular selects nos formulários) ────────────────────────
  @Get('targets/agents')
  listAgents() {
    return this.finance.listAgents();
  }

  @Get('targets/empreendimentos')
  listEmpreendimentos() {
    return this.finance.listEmpreendimentos();
  }

  // ── Lançamentos ───────────────────────────────────────────────────────────
  @Get('entries')
  @ApiQuery({ name: 'type', required: false, enum: FinancialEntryType })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  listEntries(
    @Query('type') type?: FinancialEntryType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.finance.listEntries({ type, from, to });
  }

  @Post('entries')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.RESOURCE_MANAGER)
  createEntry(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFinancialEntryDto) {
    return this.finance.createEntry(user, dto);
  }

  @Delete('entries/:id')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.RESOURCE_MANAGER)
  deleteEntry(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.finance.deleteEntry(user, id);
  }

  // ── Investimentos ─────────────────────────────────────────────────────────
  @Get('investments')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  listInvestments(@Query('from') from?: string, @Query('to') to?: string) {
    return this.finance.listInvestments({ from, to });
  }

  @Post('investments')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.RESOURCE_MANAGER)
  createInvestment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInvestmentDto) {
    return this.finance.createInvestment(user, dto);
  }

  // ── Repasses ──────────────────────────────────────────────────────────────
  @Get('allocations')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  listAllocations(@Query('from') from?: string, @Query('to') to?: string) {
    return this.finance.listAllocations({ from, to });
  }

  @Post('allocations')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.RESOURCE_MANAGER)
  createAllocation(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAllocationDto) {
    return this.finance.createAllocation(user, dto);
  }

  // ── Categorias ────────────────────────────────────────────────────────────
  @Get('categories')
  listCategories() {
    return this.finance.listCategories();
  }

  @Post('categories')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.RESOURCE_MANAGER)
  createCategory(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExpenseCategoryDto) {
    return this.finance.createCategory(user, dto);
  }

  @Delete('categories/:id')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.RESOURCE_MANAGER)
  deleteCategory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.finance.deleteCategory(user, id);
  }
}
