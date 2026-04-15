import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CollaboratorRole } from '@prisma/client';

import { AuditService, AuditType } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { ListCollaboratorDirectoryDto } from './dto/list-collaborator-directory.dto';
import { CollaboratorRepository } from './collaborator.repository';

/**
 * Mapeia realm roles do Keycloak para roles locais de colaborador.
 * Permite que o realm role 'gestor_recurso' conceda RESOURCE_MANAGER automaticamente.
 */
function deriveRolesFromRealm(realmRoles: string[]): CollaboratorRole[] {
  const derived: CollaboratorRole[] = [];

  if (realmRoles.includes('administrador')) derived.push(CollaboratorRole.ADMIN);
  if (realmRoles.includes('gestor_recurso')) derived.push(CollaboratorRole.RESOURCE_MANAGER);
  if (realmRoles.includes('gestor_projetos')) derived.push(CollaboratorRole.PROJECT_MANAGER);
  if (realmRoles.includes('gestor_pessoas')) derived.push(CollaboratorRole.PEOPLE_MANAGER);

  return derived;
}

@Injectable()
export class CollaboratorService {
  constructor(
    private readonly collaborators: CollaboratorRepository,
    private readonly audit: AuditService,
  ) {}

  /**
   * Ensures the authenticated user has a materialized local collaborator profile.
   */
  async getMe(user: AuthenticatedUser) {
    const realmDerivedRoles = deriveRolesFromRealm(user.realmRoles ?? []);

    const collaborator = await this.collaborators.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
      realmDerivedRoles,
    });

    return collaborator;
  }

  /**
   * Dashboard aggregates are used by the collaborator home page.
   */
  async getDashboard(user: AuthenticatedUser) {
    const collaborator = await this.getMe(user);
    await this.audit.logAction({
      actorId: collaborator.id,
      actorName: collaborator.name,
      actorEmail: collaborator.email,
      actionType: AuditType.AUDIT,
      actionDetail: 'Visualização do dashboard do colaborador.',
      entity: 'Collaborator',
    });

    return this.collaborators.getDashboard(collaborator.id);
  }

  listAll() {
    return this.collaborators.listAll();
  }

  /**
   * Platform directory exposed to the collaborator portal.
   */
  async listPlatformAgents(dto: ListCollaboratorDirectoryDto) {
    return this.collaborators.listPlatformAgents(dto);
  }

  /**
   * Returns only collaborators that currently belong to the internal team.
   */
  async listTeam(dto: ListCollaboratorDirectoryDto) {
    return this.collaborators.listTeam(dto);
  }

  /**
   * Updates local collaborator roles from the source agent entry.
   */
  async updateAgentRoles(actor: AuthenticatedUser, agentId: string, roles: CollaboratorRole[]) {
    const actorCollaborator = await this.collaborators.findBySubjectOrEmail(actor.sub, actor.email);
    if (!actorCollaborator) {
      throw new NotFoundException('Local collaborator profile not found.');
    }

    if (!actorCollaborator.roles.includes(CollaboratorRole.ADMIN)) {
      throw new ForbiddenException('Only administrators can update collaborator roles.');
    }

    const agent = await this.collaborators.findAgentById(agentId);
    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} not found.`);
    }

    if (!agent.authSubject) {
      throw new ForbiddenException(
        'This agent does not have a linked authentication subject yet and cannot become a collaborator.',
      );
    }

    const updated = await this.collaborators.upsertFromAgent({
      agentId: agent.id,
      authSubject: agent.authSubject,
      email: agent.email,
      name: agent.name,
      roles,
    });
    await this.audit.logAction({
      actorId: actorCollaborator.id,
      actorName: actorCollaborator.name,
      actorEmail: actorCollaborator.email,
      actionType: AuditType.SECURITY,
      actionDetail: `Atualização de papéis locais do agente ${agentId}.`,
      entity: 'Collaborator',
    });

    return updated;
  }
}
