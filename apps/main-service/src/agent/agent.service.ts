import { Injectable, NotFoundException } from '@nestjs/common';

import { AuditService, AuditType } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { AgentRepository } from './agent.repository';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';

@Injectable()
export class AgentService {
  constructor(
    private readonly agents: AgentRepository,
    private readonly audit: AuditService,
  ) {}

  async getMe(user: AuthenticatedUser) {
    return this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
  }

  async findOne(id: string, requester: AuthenticatedUser) {
    const agent = await this.agents.findById(id);

    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found.`);
    }

    await this.audit.logAction(
      requester.sub,
      AuditType.AUDIT,
      `Visualização de dados do agente ${agent.id}.`,
    );

    return agent;
  }

  async updateMe(user: AuthenticatedUser, data: UpdateAgentProfileDto) {
    const agent = await this.getMe(user);
    const updated = await this.agents.updateProfile(agent.id, data);

    await this.audit.logAction(
      agent.id,
      AuditType.TECHNICAL,
      'Atualização do perfil do agente.',
    );

    return updated;
  }

  async getDashboard(user: AuthenticatedUser) {
    const agent = await this.getMe(user);

    await this.audit.logAction(
      agent.id,
      AuditType.AUDIT,
      'Visualização do dashboard do agente.',
    );

    return this.agents.getDashboard(agent.id);
  }

  async provisionFromRegister(params: { authSubject: string; email: string; name: string }) {
    return this.agents.upsertFromIdentity(params);
  }
}
