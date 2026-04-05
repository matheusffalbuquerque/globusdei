import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';

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

  @Get('entries')
  listEntries() {
    return this.finance.listEntries();
  }

  @Post('entries')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.RESOURCE_MANAGER)
  createEntry(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFinancialEntryDto) {
    return this.finance.createEntry(user, dto);
  }

  @Get('investments')
  listInvestments() {
    return this.finance.listInvestments();
  }

  @Post('investments')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.RESOURCE_MANAGER)
  createInvestment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInvestmentDto) {
    return this.finance.createInvestment(user, dto);
  }

  @Get('allocations')
  listAllocations() {
    return this.finance.listAllocations();
  }

  @Post('allocations')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.RESOURCE_MANAGER)
  createAllocation(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAllocationDto) {
    return this.finance.createAllocation(user, dto);
  }

  @Get('categories')
  listCategories() {
    return this.finance.listCategories();
  }

  @Post('categories')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.RESOURCE_MANAGER)
  createCategory(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExpenseCategoryDto) {
    return this.finance.createCategory(user, dto);
  }
}
