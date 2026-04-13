import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  NotificationScope,
  NotificationTargetType,
  NotificationType,
  ServiceRequestCategory,
  ServiceRequestStatus,
} from '@prisma/client';

import { AgentRepository } from '../agent/agent.repository';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CollaboratorRepository } from '../collaborator/collaborator.repository';
import { NotificationGatewayService } from '../notification/notification-gateway.service';
import { PlatformRepository } from './platform.repository';
@Injectable()
export class ServiceRequestService {
  constructor(
    private readonly platform: PlatformRepository,
    private readonly agents: AgentRepository,
    private readonly collaborators: CollaboratorRepository,
    private readonly notifications: NotificationGatewayService,
  ) {}

  async createRequest(user: AuthenticatedUser, category: ServiceRequestCategory, description: string) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });

    const request = await this.platform.createServiceRequest(agent.id, category, description);

    await this.notifications.notify({
      type: NotificationType.PROCESS_UPDATE,
      scope: NotificationScope.PERSONAL,
      title: 'Solicitação registrada',
      message: 'Sua solicitação foi criada e entrou na fila operacional.',
      actionUrl: '/agent/service-requests',
      sourceEntityType: 'service_request',
      sourceEntityId: request.id,
      senderSystemLabel: 'Suporte Globus Dei',
      metadata: { category, status: request.status },
      recipients: [{ targetType: NotificationTargetType.AGENT, agentId: agent.id }],
    });

    return request;
  }

  async listForAgent(user: AuthenticatedUser) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    return this.platform.listServiceRequestsForAgent(agent.id);
  }

  listForCollaborators() {
    return this.platform.listServiceRequestsForCollaborators();
  }

  async updateStatus(
    user: AuthenticatedUser,
    id: string,
    status: ServiceRequestStatus,
    internalNotes?: string,
  ) {
    const collaborator = await this.collaborators.findBySubjectOrEmail(user.sub, user.email);
    if (!collaborator) {
      throw new ForbiddenException('Missing local collaborator profile.');
    }

    const updated = await this.platform.updateServiceRequest(id, status, internalNotes, collaborator.id);

    await this.notifications.notify({
      type: NotificationType.PROCESS_UPDATE,
      scope: NotificationScope.PERSONAL,
      title: 'Solicitação atualizada',
      message: `Sua solicitação agora está com status ${status}.`,
      actionUrl: '/agent/service-requests',
      sourceEntityType: 'service_request',
      sourceEntityId: updated.id,
      senderSystemLabel: 'Suporte Globus Dei',
      metadata: { status, internalNotes },
      recipients: [{ targetType: NotificationTargetType.AGENT, agentId: updated.agentId }],
    });

    return updated;
  }
}
