import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"

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
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || "globusdei-web",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "mock-secret-for-dev",
      issuer: process.env.KEYCLOAK_ISSUER || "http://localhost:8080/realms/globusdei",
    })
  ],
  callbacks: {
    /**
     * Captures and preserves the Bearer access_token issued by Keycloak down to the client layout.
     * This ensures client-side react components can securely trigger requests against the isolated Nx Microservices.
     */
    async jwt({ token, account }) {
      // Upon initial sign in, append the provider token details
      if (account) {
        token.accessToken = account.access_token;
        const payload = decodePayload(account.access_token);
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
