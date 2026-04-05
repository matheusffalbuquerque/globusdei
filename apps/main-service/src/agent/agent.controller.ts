import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireRealmRoles } from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { AgentService } from './agent.service';

@ApiTags('agents')
@ApiBearerAuth()
@Controller('agents')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.agentService.getMe(user);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAgentProfileDto) {
    return this.agentService.updateMe(user, dto);
  }

  @Get('me/dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.agentService.getDashboard(user);
  }

  @Get(':id')
  getAgent(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.agentService.findOne(id, user);
  }
}
