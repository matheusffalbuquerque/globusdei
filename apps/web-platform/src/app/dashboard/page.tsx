'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

import { isAgentSession, type AppSession } from '../../lib/auth';

/**
 * Dashboard entrypoint resolves the available portals after login using the
 * same client session and API access path used by the rest of the application.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const typedSession = session as AppSession | null;

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard');
      return;
    }

    const hasAgentPortal = isAgentSession(typedSession);

    if (hasAgentPortal) {
      router.replace('/agent/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router, status, typedSession]);

  return (
    <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-muted/30 px-4 py-10">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-6 py-4 text-sm font-medium text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Redirecionando para o portal do agente…
      </div>
    </div>
  );
}
