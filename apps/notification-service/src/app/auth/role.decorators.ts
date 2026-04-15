import { SetMetadata } from '@nestjs/common';
import { CollaboratorRole } from '@prisma/client';

export const REALM_ROLES_KEY = 'realm_roles';
export const COLLABORATOR_ROLES_KEY = 'collaborator_roles';
export const INTERNAL_ACCESS_KEY = 'internal_access';

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

/**
 * Restricts an endpoint to one or more Keycloak realm roles.
 */
export const RequireRealmRoles = (...roles: string[]) => SetMetadata(REALM_ROLES_KEY, roles);

/**
 * Restricts an endpoint to collaborators that also own a local operational role.
 */
export const RequireCollaboratorRoles = (...roles: CollaboratorRole[]) =>
  SetMetadata(COLLABORATOR_ROLES_KEY, roles);

/**
 * Allows service-to-service authenticated traffic using the internal token header.
 */
export const AllowInternalAccess = () => SetMetadata(INTERNAL_ACCESS_KEY, true);
