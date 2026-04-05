import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireCollaboratorRoles, RequireRealmRoles } from '../auth/role.decorators';
import { AuthenticatedUser } from '../auth/user-context.interface';
import { CreateEventDto } from './dto/create-event.dto';
import { EventService } from './event.service';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class EventController {
  constructor(private readonly events: EventService) {}

  @Get()
  listAll() {
    return this.events.listAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.events.findOne(id, user);
  }

  @Post()
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PROJECT_MANAGER)
  create(@Body() dto: CreateEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.events.create(dto, user);
  }
}
