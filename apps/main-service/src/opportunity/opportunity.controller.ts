import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole, OpportunityCategory } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import {
  RequireCollaboratorRoles,
  RequireRealmRoles,
} from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunityService } from './opportunity.service';

@ApiTags('opportunities')
@ApiBearerAuth()
@Controller('opportunities')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  // ── Listagem pública (agentes e colaboradores) ────────────────────────────

  @Get()
  @ApiQuery({ name: 'category', required: false, enum: OpportunityCategory })
  @ApiQuery({ name: 'search', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: OpportunityCategory,
    @Query('search') search?: string,
  ) {
    const isCollaborator =
      user.realmRoles?.includes('colaborador') ||
      user.realmRoles?.includes('administrador');

    return isCollaborator
      ? this.opportunityService.listAll(category, search)
      : this.opportunityService.listPublished(category, search);
  }

  // ── Detalhe ───────────────────────────────────────────────────────────────

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const isCollaborator =
      user.realmRoles?.includes('colaborador') ||
      user.realmRoles?.includes('administrador');

    return isCollaborator
      ? this.opportunityService.findOneAsCollaborator(id)
      : this.opportunityService.findOne(id);
  }

  // ── Criação ───────────────────────────────────────────────────────────────

  /** Colaboradores (admin ou project_manager) criam oportunidades pela plataforma */
  @Post('collaborator')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PROJECT_MANAGER)
  createByCollaborator(
    @Body() dto: CreateOpportunityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.opportunityService.createByCollaborator(user, dto);
  }

  /** Agentes aprovados com empreendimento criam oportunidades */
  @Post('agent')
  createByAgent(
    @Body() dto: CreateOpportunityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.opportunityService.createByAgent(user, dto);
  }

  // ── Edição ────────────────────────────────────────────────────────────────

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.opportunityService.update(id, user, dto);
  }

  // ── Remoção (admin / project_manager) ─────────────────────────────────────

  @Delete(':id')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PROJECT_MANAGER)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.opportunityService.remove(id, user);
  }
}
