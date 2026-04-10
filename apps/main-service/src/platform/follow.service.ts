import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { AgentRepository } from '../agent/agent.repository';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { PlatformRepository } from './platform.repository';

@Injectable()
export class FollowService {
  constructor(
    private readonly platform: PlatformRepository,
    private readonly agents: AgentRepository,
  ) {}

  async follow(user: AuthenticatedUser, empreendimentoId: string) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    const empreendimento = await this.platform.findEmpreendimento(empreendimentoId);
    if (!empreendimento) {
      throw new NotFoundException('Empreendimento not found.');
    }

    const existing = await this.platform.findFollow(agent.id, empreendimentoId);
    if (existing) {
      throw new ConflictException('Already following.');
    }

    return this.platform.follow(agent.id, empreendimentoId);
  }

  async unfollow(user: AuthenticatedUser, empreendimentoId: string) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    return this.platform.unfollow(agent.id, empreendimentoId);
  }

  async getFollowing(user: AuthenticatedUser) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    return this.platform.getFollowing(agent.id);
  }

  async listAllWithFollowStatus(user: AuthenticatedUser) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    return this.platform.listAllWithFollowStatus(agent.id);
  }
}
