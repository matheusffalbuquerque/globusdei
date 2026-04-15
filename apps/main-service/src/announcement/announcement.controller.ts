import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import {
  PLATFORM_REALM_ROLES,
  RequireCollaboratorRoles,
  RequireRealmRoles,
} from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { AnnouncementService } from './announcement.service';

@ApiTags('announcements')
@ApiBearerAuth()
@Controller('announcements')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles(...PLATFORM_REALM_ROLES)
export class AnnouncementController {
  constructor(private readonly announcements: AnnouncementService) {}

  @Get()
  listRecent() {
    return this.announcements.listRecent();
  }

  @Get('all')
  listAll() {
    return this.announcements.listAll();
  }

  @Post()
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PROJECT_MANAGER)
  create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: AuthenticatedUser) {
    return this.announcements.create(dto, user);
  }

  @Delete(':id')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PROJECT_MANAGER)
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.announcements.delete(id, user);
  }
}
