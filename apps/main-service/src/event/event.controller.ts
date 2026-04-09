import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireCollaboratorRoles, RequireRealmRoles } from '../auth/role.decorators';
import { AuthenticatedUser } from '../auth/user-context.interface';
import { CreateEventDto } from './dto/create-event.dto';
import { RsvpEventDto } from './dto/rsvp-event.dto';
import { EventService } from './event.service';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class EventController {
  constructor(private readonly events: EventService) {}

  /** Lista todos os eventos (agente + colaborador) */
  @Get()
  listAll() {
    return this.events.listAll();
  }

  /** Detalhe de um evento com contagem de confirmados */
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.events.findOne(id, user);
  }

  /** Cria um evento — apenas ADMIN e PROJECT_MANAGER */
  @Post()
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PROJECT_MANAGER)
  create(@Body() dto: CreateEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.events.create(dto, user);
  }

  /** Cancela um evento — apenas ADMIN e PROJECT_MANAGER */
  @Patch(':id/cancel')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PROJECT_MANAGER)
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.events.cancel(id, user);
  }

  /** Confirma ou cancela presença do agente autenticado */
  @Post(':id/rsvp')
  @RequireRealmRoles('agente')
  rsvp(
    @Param('id') id: string,
    @Body() dto: RsvpEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.events.rsvp(id, dto, user);
  }

  /** Retorna o RSVP do agente autenticado para um evento */
  @Get(':id/rsvp/me')
  @RequireRealmRoles('agente')
  getMyRsvp(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.events.getMyRsvp(id, user);
  }
}
