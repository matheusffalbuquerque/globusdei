import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CollaboratorRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { COLLABORATOR_ROLES_KEY, INTERNAL_ACCESS_KEY, REALM_ROLES_KEY } from './role.decorators';
import type { AuthenticatedUser } from './user-context.interface';

/**
 * Applies realm-role and collaborator-role policies to notification endpoints.
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  private readonly logger = new Logger(PoliciesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    const realmRoles =
      this.reflector.getAllAndOverride<string[]>(REALM_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    const collaboratorRoles =
      this.reflector.getAllAndOverride<CollaboratorRole[]>(COLLABORATOR_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    const allowsInternal =
      this.reflector.getAllAndOverride<boolean>(INTERNAL_ACCESS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (!user) {
      throw new ForbiddenException('Missing authenticated user context.');
    }

    if (user.isInternalService) {
      if (!allowsInternal) {
        throw new ForbiddenException('Internal service is not allowed on this endpoint.');
      }

      return true;
    }

    if (realmRoles.length > 0 && !realmRoles.some((role) => user.realmRoles.includes(role))) {
      this.logger.warn(`Realm role mismatch for actor ${user.sub}.`);
      throw new ForbiddenException('Missing required realm role.');
    }

    if (collaboratorRoles.length > 0) {
      const collaborator = await this.prisma.collaborator.findFirst({
        where: {
          OR: [{ authSubject: user.sub }, { email: user.email }],
        },
      });

      if (!collaborator) {
        throw new ForbiddenException('Missing local collaborator profile.');
      }

      const hasRole = collaboratorRoles.some((role) => collaborator.roles.includes(role));
      if (!hasRole) {
        this.logger.warn(`Collaborator role mismatch for actor ${user.sub}.`);
        throw new ForbiddenException('Missing required collaborator role.');
      }

      request.collaborator = collaborator;
    }

    return true;
  }
}
