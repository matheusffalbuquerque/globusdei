'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useEffect, ReactNode } from 'react';

/**
 * Observa a sessão e faz logout automático se o refresh token falhar.
 * Evita que o usuário fique preso com um access_token expirado sem perceber.
 */
function SessionErrorWatcher() {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as any)?.error === 'RefreshAccessTokenError') {
      signOut({ callbackUrl: '/login' });
    }
  }, [session]);

  return null;
}

export function AppSessionProvider({ children }: { children: ReactNode }) {
  return (
    // refetchInterval: NextAuth verifica a sessão a cada 4 minutos no cliente,
    // acionando o callback `jwt` e renovando o token antes de ele expirar.
    <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus>
      <SessionErrorWatcher />
      {children}
    </SessionProvider>
  );
}
