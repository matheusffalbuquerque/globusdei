import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import {
  RequireCollaboratorRoles,
  RequireRealmRoles,
} from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CreateEmpreendimentoDto } from './dto/create-empreendimento.dto';
import { CreateEmpreendimentoInviteDto } from './dto/create-empreendimento-invite.dto';
import { UpdateEmpreendimentoDto } from './dto/update-empreendimento.dto';
import { UpdateEmpreendimentoInternalDto } from './dto/update-empreendimento-internal.dto';
import { EmpreendimentoService } from './empreendimento.service';

@ApiTags('empreendimentos')
@ApiBearerAuth()
@Controller('empreendimentos')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class EmpreendimentoController {
  constructor(private readonly empreendimentos: EmpreendimentoService) {}

  @Get()
  listAll() {
    return this.empreendimentos.listAll();
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.empreendimentos.listMine(user);
  }

  @Get('invites/my')
  listMyInvites(@CurrentUser() user: AuthenticatedUser) {
    return this.empreendimentos.listMyInvites(user);
  }

  @Post('invites/:token/accept')
  acceptInvite(@Param('token') token: string, @CurrentUser() user: AuthenticatedUser) {
    return this.empreendimentos.acceptInvite(token, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.empreendimentos.findOne(id, user);
  }

  @Get(':id/members')
  listMembers(@Param('id') id: string) {
    return this.empreendimentos.listMembers(id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEmpreendimentoDto) {
    return this.empreendimentos.create(user, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmpreendimentoDto,
  ) {
    return this.empreendimentos.update(id, user, dto);
  }

  @Patch(':id/internal')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PROJECT_MANAGER)
  updateInternal(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmpreendimentoInternalDto,
  ) {
    return this.empreendimentos.updateInternal(id, user, dto);
  }

  @Get(':id/bank')
  getBankDetails(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.empreendimentos.getBankDetails(id, user);
  }

  @Post(':id/invites')
  createInvite(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmpreendimentoInviteDto,
  ) {
    return this.empreendimentos.createInvite(id, user, dto);
  }
}
