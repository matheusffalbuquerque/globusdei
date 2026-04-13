import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedUser } from './user-context.interface';

/**
 * Exposes the authenticated user already validated by KeycloakAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest().user,
);
