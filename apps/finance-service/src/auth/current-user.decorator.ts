import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedUser } from './user-context.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest().user,
);
