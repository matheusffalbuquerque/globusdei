import NextAuth, { type NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8085";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "globusdei";
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || "globusdei-web";
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || "mock-secret-for-dev";
const TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

// Margem de segurança: renova o token 60 s antes de expirar.
const REFRESH_MARGIN_SECONDS = 60;

function decodePayload(accessToken?: string) {
  if (!accessToken) return null;
  try {
    const [, payload] = accessToken.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Solicita um novo access_token usando o refresh_token armazenado no JWT do NextAuth.
 * Retorna o token atualizado ou o token original com `error: 'RefreshAccessTokenError'`
 * para que o cliente possa redirecionar para o login.
 */
async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: KEYCLOAK_CLIENT_ID,
      client_secret: KEYCLOAK_CLIENT_SECRET,
      refresh_token: token.refreshToken as string,
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!res.ok) throw new Error(`Keycloak refresh failed: ${res.status}`);

    const tokens = await res.json();
    const payload = decodePayload(tokens.access_token);
    const nowSec = Math.floor(Date.now() / 1000);

    return {
      ...token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? token.refreshToken,
      accessTokenExpiresAt: nowSec + (tokens.expires_in as number),
      realmRoles: payload?.realm_access?.roles ?? token.realmRoles,
      error: undefined,
    };
  } catch (err) {
    console.error('[NextAuth] Falha ao renovar token:', err);
    return { ...token, error: 'RefreshAccessTokenError' as const };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    /**
     * CredentialsProvider: Resource Owner Password Grant do Keycloak.
     * Armazena access_token + refresh_token + tempo de expiração.
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
            scope: "openid email profile offline_access",
          });

          const res = await fetch(TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params,
          });

          if (!res.ok) return null;

          const tokens = await res.json();
          const payload = decodePayload(tokens.access_token);
          const nowSec = Math.floor(Date.now() / 1000);

          return {
            id: payload?.sub ?? credentials.email,
            email: payload?.email ?? credentials.email,
            name: payload?.name ?? "",
            // Campos extras: propagados para o JWT callback via `user`
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            accessTokenExpiresAt: nowSec + (tokens.expires_in as number),
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
      authorization: { params: { scope: "openid email profile offline_access" } },
      checks: ["state"],
      idToken: false,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET || "globusdei-nextauth-secret-dev",

  // Quando atrás de proxy reverso HTTPS (nginx → container HTTP),
  // o NextAuth v4 define useSecureCookies=true pelo NEXTAUTH_URL https://.
  // Isso faz o Set-Cookie incluir Secure, que o browser só aceita em HTTPS —
  // correto. Mas o Next.js internamente tenta ler/gravar esses cookies via
  // http://localhost:3000 (NEXTAUTH_URL_INTERNAL), o que falha.
  // Solução: cookies sem prefixo __Secure- e sem flag secure na configuração
  // interna, deixando o nginx/browser gerenciar o Secure corretamente.
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },

  // Sessão baseada em JWT (padrão para Credentials + Keycloak).
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, account, user }) {
      // ── 1. Login inicial (Credentials) ──────────────────────────────────
      const u = user as {
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpiresAt?: number;
        realmRoles?: string[];
        id?: string;
      } | undefined;

      if (u?.accessToken) {
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.accessTokenExpiresAt = u.accessTokenExpiresAt;
        token.sub = u.id;
        token.realmRoles = u.realmRoles ?? [];
        return token;
      }

      // ── 2. Login inicial (OAuth / Keycloak redirect) ──────────────────
      if (account?.access_token) {
        const payload = decodePayload(account.access_token);
        const nowSec = Math.floor(Date.now() / 1000);
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpiresAt = nowSec + (account.expires_in as number ?? 300);
        token.sub = payload?.sub;
        token.realmRoles = payload?.realm_access?.roles ?? [];
        return token;
      }

      // ── 3. Chamadas subsequentes: verificar se o token ainda é válido ──
      const expiresAt = (token.accessTokenExpiresAt as number | undefined) ?? 0;
      const nowSec = Math.floor(Date.now() / 1000);

      if (nowSec < expiresAt - REFRESH_MARGIN_SECONDS) {
        // Token ainda válido — retornar sem modificar.
        return token;
      }

      // ── 4. Token expirado (ou perto de expirar) → renovar ──────────────
      if (!token.refreshToken) {
        return { ...token, error: 'RefreshAccessTokenError' as const };
      }

      return refreshAccessToken(token as Record<string, unknown>);
    },

    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).error = (token as any).error;
      (session as any).user = {
        ...session.user,
        id: token.sub,
        realmRoles: (token as any).realmRoles ?? [],
      };
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
