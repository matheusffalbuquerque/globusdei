import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CollaboratorRole } from '@prisma/client';

import { AuditService, AuditType } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/user-context.interface';
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

  async getDashboard(user: AuthenticatedUser) {
    const collaborator = await this.getMe(user);
    await this.audit.logAction(
      collaborator.id,
      AuditType.AUDIT,
      'Visualização do dashboard do colaborador.',
    );

    return this.collaborators.getDashboard(collaborator.id);
  }

  listAll() {
    return this.collaborators.listAll();
  }

  async updateRoles(actor: AuthenticatedUser, collaboratorId: string, roles: CollaboratorRole[]) {
    const actorCollaborator = await this.collaborators.findBySubjectOrEmail(actor.sub, actor.email);
    if (!actorCollaborator) {
      throw new NotFoundException('Local collaborator profile not found.');
    }

    if (!actorCollaborator.roles.includes(CollaboratorRole.ADMIN)) {
      throw new ForbiddenException('Only administrators can update collaborator roles.');
    }

    const updated = await this.collaborators.updateRoles(collaboratorId, roles);
    await this.audit.logAction(
      actorCollaborator.id,
      AuditType.SECURITY,
      `Atualização de papéis do colaborador ${collaboratorId}.`,
    );

    return updated;
  }
}
