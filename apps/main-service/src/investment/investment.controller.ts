import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AgentInvestmentTargetType,
  AgentInvestmentType,
  CollaboratorRole,
} from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import {
  RequireCollaboratorRoles,
  RequireRealmRoles,
} from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { InvestmentService } from './investment.service';

@ApiTags('investments')
@ApiBearerAuth()
@Controller('investments')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  // ── Colaborador: listagem geral com filtros ───────────────────────────────

  @Get()
  @RequireRealmRoles('colaborador', 'administrador')
  @ApiQuery({ name: 'targetType', required: false, enum: AgentInvestmentTargetType })
  @ApiQuery({ name: 'type', required: false, enum: AgentInvestmentType })
  @ApiQuery({ name: 'investorId', required: false })
  @ApiQuery({ name: 'targetId', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  listAll(
    @Query('targetType') targetType?: AgentInvestmentTargetType,
    @Query('type') type?: AgentInvestmentType,
    @Query('investorId') investorId?: string,
    @Query('targetId') targetId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.investmentService.listAll(
      targetType,
      type,
      investorId,
      targetId,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  // ── Agente: carteira pessoal ──────────────────────────────────────────────

  @Get('wallet')
  @RequireRealmRoles('agente')
  getWallet(@CurrentUser() user: AuthenticatedUser) {
    return this.investmentService.getWallet(user);
  }

  // ── Agente: investimentos recebidos pessoais ──────────────────────────────

  @Get('received/me')
  @RequireRealmRoles('agente')
  getReceivedByMe(@CurrentUser() user: AuthenticatedUser) {
    return this.investmentService.getReceivedByAgent(user);
  }

  // ── Agente: investimentos recebidos por todos os seus empreendimentos ─────

  @Get('received/my-empreendimentos')
  @RequireRealmRoles('agente')
  getReceivedByMyEmpreendimentos(@CurrentUser() user: AuthenticatedUser) {
    return this.investmentService.getReceivedByMyEmpreendimentos(user);
  }

  // ── Investimentos recebidos por empreendimento ────────────────────────────

  @Get('received/empreendimento/:id')
  getReceivedByEmpreendimento(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investmentService.getReceivedByEmpreendimento(id, user);
  }

  // ── Detalhe por ID ────────────────────────────────────────────────────────

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.investmentService.findOne(id);
  }

  // ── Criar (agente investidor) ─────────────────────────────────────────────

  @Post()
  @RequireRealmRoles('agente')
  create(
    @Body() dto: CreateInvestmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investmentService.create(user, dto);
  }

  // ── Deletar (colaborador admin) ───────────────────────────────────────────

  @Delete(':id')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investmentService.remove(id, user);
  }
}
