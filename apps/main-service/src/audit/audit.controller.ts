import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';

import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import {
  OPERATIONAL_COLLABORATOR_REALM_ROLES,
  RequireCollaboratorRoles,
  RequireRealmRoles,
} from '../auth/role.decorators';
import { AuditQueryService } from './audit-query.service';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles(...OPERATIONAL_COLLABORATOR_REALM_ROLES)
@RequireCollaboratorRoles(CollaboratorRole.ADMIN)
export class AuditController {
  constructor(private readonly auditQuery: AuditQueryService) {}

  @Get('logs')
  listLogs(@Query() dto: ListAuditLogsDto) {
    return this.auditQuery.listLogs(dto);
  }

  @Get('stats')
  getStats() {
    return this.auditQuery.getStats();
  }
}
