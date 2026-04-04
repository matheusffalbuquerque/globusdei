import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AgentService } from './agent.service';
import { Prisma } from '@prisma/client';

/**
 * Agent Controller
 * Exposes core REST APIs meant to be gated by the upcoming OAuth2/OIDC RBAC guards.
 */
@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get(':id')
  async getAgent(@Param('id') id: string) {
    // Hardcoded mock user ID until AuthGuard Keycloak sets Request context
    const reqUserId = 'SYSTEM_ADMIN_MOCK'; 
    return this.agentService.findOne(id, reqUserId);
  }

  @Post()
  async createAgent(@Body() data: Prisma.AgentCreateInput) {
    const reqUserId = 'SYSTEM_ADMIN_MOCK';
    return this.agentService.create(data, reqUserId);
  }
}
