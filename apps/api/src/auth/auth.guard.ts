import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticationRequiredException } from './auth.errors';
import type { AuthenticatedRequest } from './auth-request';
import { TokenService } from './token.service';

const BEARER_CREDENTIAL_PATTERN =
  /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i;

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<AuthenticatedRequest>();
    const response = httpContext.getResponse<Response>();
    response.setHeader('Cache-Control', 'no-store');

    const authorizationValues = request.headersDistinct.authorization;
    const authorization =
      authorizationValues?.length === 1 ? authorizationValues[0] : undefined;
    const credential =
      typeof authorization === 'string'
        ? BEARER_CREDENTIAL_PATTERN.exec(authorization)
        : null;
    if (credential === null) {
      throw new AuthenticationRequiredException();
    }

    const verifiedToken = this.tokenService.verify(credential[1]);
    if (verifiedToken === null) {
      throw new AuthenticationRequiredException();
    }

    const principal = await this.authService.findPrincipalById(
      verifiedToken.subject,
    );
    if (principal === null) {
      throw new AuthenticationRequiredException();
    }

    request.auth = principal;
    return true;
  }
}
