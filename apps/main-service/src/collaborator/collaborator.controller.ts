import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireCollaboratorRoles, RequireRealmRoles } from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CollaboratorRole } from '@prisma/client';
import { CollaboratorService } from './collaborator.service';
import { UpdateCollaboratorRolesDto } from './dto/update-collaborator-roles.dto';

@ApiTags('collaborators')
@ApiBearerAuth()
@Controller('collaborators')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('colaborador', 'administrador')
export class CollaboratorController {
  constructor(private readonly collaborators: CollaboratorService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.collaborators.getMe(user);
  }

  @Get('me/dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.collaborators.getDashboard(user);
  }

  @Get()
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  listAll() {
    return this.collaborators.listAll();
  }

  @Patch(':id/roles')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  updateRoles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCollaboratorRolesDto,
  ) {
    return this.collaborators.updateRoles(user, id, dto.roles);
  }
}
