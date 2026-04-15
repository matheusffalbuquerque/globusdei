import { SetMetadata } from '@nestjs/common';

import { CollaboratorRole } from '@prisma/client';

export const REALM_ROLES_KEY = 'realm_roles';
export const COLLABORATOR_ROLES_KEY = 'collaborator_roles';

export const OPERATIONAL_COLLABORATOR_REALM_ROLES = [
  'colaborador',
  'administrador',
  'gestor_recurso',
  'gestor_projetos',
  'gestor_pessoas',
] as const;

export const PLATFORM_REALM_ROLES = [
  'agente',
  ...OPERATIONAL_COLLABORATOR_REALM_ROLES,
] as const;

export const RequireRealmRoles = (...roles: string[]) => SetMetadata(REALM_ROLES_KEY, roles);
export const RequireCollaboratorRoles = (...roles: CollaboratorRole[]) =>
  SetMetadata(COLLABORATOR_ROLES_KEY, roles);
