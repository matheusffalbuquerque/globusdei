import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireCollaboratorRoles, RequireRealmRoles } from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { FollowService } from './follow.service';
import { ServiceRequestService } from './service-request.service';

@ApiTags('platform')
@ApiBearerAuth()
@Controller('platform')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class PlatformController {
  constructor(
    private readonly follows: FollowService,
    private readonly serviceRequests: ServiceRequestService,
  ) {}

  @Post('follow/:empreendimentoId')
  follow(@CurrentUser() user: AuthenticatedUser, @Param('empreendimentoId') empreendimentoId: string) {
    return this.follows.follow(user, empreendimentoId);
  }

  @Post('unfollow/:empreendimentoId')
  unfollow(@CurrentUser() user: AuthenticatedUser, @Param('empreendimentoId') empreendimentoId: string) {
    return this.follows.unfollow(user, empreendimentoId);
  }

  @Get('following')
  getFollowing(@CurrentUser() user: AuthenticatedUser) {
    return this.follows.getFollowing(user);
  }

  /** Todos os empreendimentos com isFollowing para o agente autenticado */
  @Get('empreendimentos')
  listAllEmpreendimentos(@CurrentUser() user: AuthenticatedUser) {
    return this.follows.listAllWithFollowStatus(user);
  }

  @Post('service-requests')
  createServiceRequest(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateServiceRequestDto) {
    return this.serviceRequests.createRequest(user, dto.category, dto.description);
  }

  @Get('service-requests/mine')
  listMyServiceRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.serviceRequests.listForAgent(user);
  }

  @Get('service-requests')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER, CollaboratorRole.PROJECT_MANAGER)
  listAllServiceRequests() {
    return this.serviceRequests.listForCollaborators();
  }

  @Patch('service-requests/:id/status')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER, CollaboratorRole.PROJECT_MANAGER)
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceRequestStatusDto,
  ) {
    return this.serviceRequests.updateStatus(user, id, dto.status, dto.internalNotes);
  }
}
