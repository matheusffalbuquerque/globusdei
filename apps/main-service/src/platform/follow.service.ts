import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { AgentRepository } from '../agent/agent.repository';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { NotificationGatewayService } from '../notification/notification-gateway.service';
import { PlatformRepository } from './platform.repository';
import {
  NotificationScope,
  NotificationTargetType,
  NotificationType,
} from '@prisma/client';

@Injectable()
export class FollowService {
  constructor(
    private readonly platform: PlatformRepository,
    private readonly agents: AgentRepository,
    private readonly notificationGateway: NotificationGatewayService,
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

    const follow = await this.platform.follow(agent.id, empreendimentoId);

    await this.notificationGateway.notify({
      type: NotificationType.NEW_FOLLOWER,
      scope: NotificationScope.INITIATIVE,
      title: 'Novo seguidor na sua iniciativa',
      message: `${agent.name} começou a acompanhar esta iniciativa.`,
      actionUrl: `/agent/empreendimentos/${empreendimentoId}`,
      sourceEntityType: 'empreendimento_follow',
      sourceEntityId: empreendimentoId,
      senderSystemLabel: 'Rede Global',
      metadata: {
        followerId: agent.id,
        followerName: agent.name,
      },
      recipients: [
        {
          targetType: NotificationTargetType.EMPREENDIMENTO,
          empreendimentoId,
        },
      ],
    });

    return follow;
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
