import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticationRequiredException } from './auth.errors';
import type { AuthenticatedRequest } from './auth-request';
import type { AuthPrincipal } from './auth.types';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.auth === undefined) {
      throw new AuthenticationRequiredException();
    }

    return request.auth;
  },
);
