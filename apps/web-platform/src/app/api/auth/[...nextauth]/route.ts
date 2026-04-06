import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import CredentialsProvider from "next-auth/providers/credentials"

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8085";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "globusdei";
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || "globusdei-web";
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || "mock-secret-for-dev";

function decodePayload(accessToken?: string) {
  if (!accessToken) {
    return null;
  }

  try {
    const [, payload] = accessToken.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Executes standard Next.js securely-tokenized Identity verification.
 * Adheres strictly to the architectural requirements to route all authentication through Keycloak.
 */
const handler = NextAuth({
  providers: [
    /**
     * CredentialsProvider: usa o Resource Owner Password Grant do Keycloak.
     * O email/senha digitados no formulário são validados diretamente contra o Keycloak,
     * sem redirecionar o usuário para a tela do Keycloak.
     */
    CredentialsProvider({
      id: "keycloak-credentials",
      name: "Email e Senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const params = new URLSearchParams({
            grant_type: "password",
            client_id: KEYCLOAK_CLIENT_ID,
            client_secret: KEYCLOAK_CLIENT_SECRET,
            username: credentials.email,
            password: credentials.password,
            scope: "openid email profile",
          });

          const res = await fetch(
            `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: params,
            }
          );

          if (!res.ok) return null;

          const tokens = await res.json();
          const payload = decodePayload(tokens.access_token);

          return {
            id: payload?.sub ?? credentials.email,
            email: payload?.email ?? credentials.email,
            name: payload?.name ?? "",
            accessToken: tokens.access_token,
            realmRoles: payload?.realm_access?.roles ?? [],
          };
        } catch {
          return null;
        }
      },
    }),

    KeycloakProvider({
      clientId: KEYCLOAK_CLIENT_ID,
      clientSecret: KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER || `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "globusdei-nextauth-secret-dev",
  callbacks: {
    /**
     * Captures and preserves the Bearer access_token issued by Keycloak down to the client layout.
     * This ensures client-side react components can securely trigger requests against the isolated Nx Microservices.
     */
    async jwt({ token, account, user }) {
      /**
       * Credentials login returns the accessToken on `user`, while OAuth-based flows
       * expose it on `account`. The callback supports both to keep the dashboard
       * flows consistent across login modes.
       */
      const accessToken =
        account?.access_token ?? (user as { accessToken?: string } | undefined)?.accessToken;
      const payload =
        decodePayload(accessToken) ??
        ((user as { realmRoles?: string[]; id?: string } | undefined)
          ? {
              realm_access: { roles: (user as { realmRoles?: string[] }).realmRoles ?? [] },
              sub: (user as { id?: string }).id,
            }
          : null);

      if (accessToken) {
        token.accessToken = accessToken;
      }

      if (payload) {
        token.realmRoles = payload?.realm_access?.roles ?? [];
        token.sub = payload?.sub;
      }

      return token;
    },
    async session({ session, token }) {
      // Standardize the session payload format exposing the JWT for client fetch utilities
      (session as any).accessToken = token.accessToken;
      (session as any).user = {
        ...session.user,
        id: token.sub,
        realmRoles: (token as any).realmRoles ?? [],
      };
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
})

export { handler as GET, handler as POST }
