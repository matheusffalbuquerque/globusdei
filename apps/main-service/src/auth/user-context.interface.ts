export interface AuthenticatedUser {
  sub: string;
  email: string;
  name: string;
  preferredUsername: string;
  realmRoles: string[];
  accessToken?: string;
}
