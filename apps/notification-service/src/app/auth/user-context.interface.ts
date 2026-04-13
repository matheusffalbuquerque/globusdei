/**
 * Shared authenticated actor representation used by the notification API.
 */
export interface AuthenticatedUser {
  sub: string;
  email: string;
  name: string;
  preferredUsername: string;
  realmRoles: string[];
  accessToken?: string;
  isInternalService?: boolean;
}
