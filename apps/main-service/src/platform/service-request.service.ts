import { ForbiddenException, Injectable } from '@nestjs/common';
import { ServiceRequestCategory, ServiceRequestStatus } from '@prisma/client';

import { AgentRepository } from '../agent/agent.repository';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CollaboratorRepository } from '../collaborator/collaborator.repository';
import { PlatformRepository } from './platform.repository';

@Injectable()
export class ServiceRequestService {
  constructor(
    private readonly platform: PlatformRepository,
    private readonly agents: AgentRepository,
    private readonly collaborators: CollaboratorRepository,
  ) {}

  async createRequest(user: AuthenticatedUser, category: ServiceRequestCategory, description: string) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });

    return this.platform.createServiceRequest(agent.id, category, description);
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

    return this.platform.updateServiceRequest(id, status, internalNotes, collaborator.id);
  }
}
