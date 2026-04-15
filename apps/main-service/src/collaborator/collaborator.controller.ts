import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireCollaboratorRoles } from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CollaboratorRole } from '@prisma/client';
import { CollaboratorService } from './collaborator.service';
import { ListCollaboratorDirectoryDto } from './dto/list-collaborator-directory.dto';
import { UpdateCollaboratorRolesDto } from './dto/update-collaborator-roles.dto';

@ApiTags('collaborators')
@ApiBearerAuth()
@Controller('collaborators')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
export class CollaboratorController {
  constructor(private readonly collaborators: CollaboratorService) {}

  private static readonly ALL_LOCAL_COLLABORATOR_ROLES = [
    CollaboratorRole.ADMIN,
    CollaboratorRole.PEOPLE_MANAGER,
    CollaboratorRole.PROJECT_MANAGER,
    CollaboratorRole.RESOURCE_MANAGER,
  ] as const;

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.collaborators.getMe(user);
  }

  @Get('me/dashboard')
  @RequireCollaboratorRoles(...CollaboratorController.ALL_LOCAL_COLLABORATOR_ROLES)
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.collaborators.getDashboard(user);
  }

  @Get()
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  listAll() {
    return this.collaborators.listAll();
  }

  /**
   * Lists every platform agent together with the local collaboration context, if one exists.
   * All collaborators may inspect the directory, but only admins can modify roles.
   */
  @Get('agents')
  @RequireCollaboratorRoles(...CollaboratorController.ALL_LOCAL_COLLABORATOR_ROLES)
  listAgents(@Query() dto: ListCollaboratorDirectoryDto) {
    return this.collaborators.listPlatformAgents(dto);
  }

  /**
   * Lists only team members that currently have local roles assigned in Globus Dei.
   */
  @Get('team')
  @RequireCollaboratorRoles(...CollaboratorController.ALL_LOCAL_COLLABORATOR_ROLES)
  listTeam(@Query() dto: ListCollaboratorDirectoryDto) {
    return this.collaborators.listTeam(dto);
  }

  /**
   * Updates local collaborator roles from an existing platform agent record.
   */
  @Patch('agents/:agentId/roles')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  updateAgentRoles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('agentId') agentId: string,
    @Body() dto: UpdateCollaboratorRolesDto,
  ) {
    return this.collaborators.updateAgentRoles(user, agentId, dto.roles);
  }
}
