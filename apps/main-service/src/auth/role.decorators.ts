import { SetMetadata } from '@nestjs/common';

import { CollaboratorRole } from '@prisma/client';

export const REALM_ROLES_KEY = 'realm_roles';
export const COLLABORATOR_ROLES_KEY = 'collaborator_roles';

export const RequireRealmRoles = (...roles: string[]) => SetMetadata(REALM_ROLES_KEY, roles);
export const RequireCollaboratorRoles = (...roles: CollaboratorRole[]) =>
  SetMetadata(COLLABORATOR_ROLES_KEY, roles);
