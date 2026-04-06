import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import type { AuthenticatedUser } from './user-context.interface';

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  private readonly logger = new Logger(KeycloakAuthGuard.name);
  private readonly issuer =
    process.env.KEYCLOAK_ISSUER ?? 'http://localhost:8085/realms/globusdei';
  private readonly audience = process.env.KEYCLOAK_CLIENT_ID;
  private readonly jwks = jwksClient({
    jwksUri:
      process.env.KEYCLOAK_JWKS_URI ??
      `${this.issuer}/protocol/openid-connect/certs`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 10 * 60 * 1000,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.substring('Bearer '.length);
      request.user = await this.verifyToken(token);
      return true;
    }

    const devUser = this.getDevelopmentUser(request.headers);
    if (devUser) {
      request.user = devUser;
      return true;
    }

    this.logger.warn('Rejected unauthenticated access attempt.');
    throw new UnauthorizedException('Authentication required.');
  }

  private async verifyToken(token: string): Promise<AuthenticatedUser> {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
        throw new Error('Missing JWT header metadata.');
      }

      const signingKey = await this.jwks.getSigningKey(decoded.header.kid);
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: ['RS256'],
        issuer: this.issuer,
      };

      const payload = jwt.verify(
        token,
        signingKey.getPublicKey(),
        verifyOptions,
      ) as jwt.JwtPayload;

      if (!payload.sub) {
        throw new Error('JWT subject is required.');
      }

      this.assertClientBinding(payload);

      const realmRoles = Array.isArray(payload.realm_access?.roles)
        ? payload.realm_access.roles
        : [];

      return {
        sub: payload.sub,
        email: payload.email ?? payload.preferred_username ?? '',
        name: payload.name ?? payload.preferred_username ?? payload.email ?? 'Usuário',
        preferredUsername: payload.preferred_username ?? payload.email ?? payload.sub,
        realmRoles,
        accessToken: token,
      };
    } catch (error) {
      this.logger.error('Token signature validation failed.', error as Error);
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  /**
   * Keycloak access tokens may expose the client id on `azp`, `aud`, or both.
   * This keeps client validation strict without rejecting valid realm-issued tokens.
   */
  private assertClientBinding(payload: jwt.JwtPayload) {
    if (!this.audience) {
      return;
    }

    const audiences = Array.isArray(payload.aud)
      ? payload.aud
      : payload.aud
        ? [payload.aud]
        : [];
    const isBoundToClient =
      audiences.includes(this.audience) || payload.azp === this.audience;

    if (!isBoundToClient) {
      throw new Error('JWT client binding mismatch.');
    }
  }

  private getDevelopmentUser(headers: Record<string, string | string[] | undefined>): AuthenticatedUser | null {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    const sub = this.getHeaderValue(headers['x-dev-user-sub']);
    const email = this.getHeaderValue(headers['x-dev-user-email']);
    const name = this.getHeaderValue(headers['x-dev-user-name']);
    const rolesHeader = this.getHeaderValue(headers['x-dev-user-roles']);

    if (!sub || !email) {
      return null;
    }

    return {
      sub,
      email,
      name: name ?? email,
      preferredUsername: email,
      realmRoles: rolesHeader ? rolesHeader.split(',').map((role) => role.trim()) : [],
    };
  }

  private getHeaderValue(value?: string | string[]): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }
}
