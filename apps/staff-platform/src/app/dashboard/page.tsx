'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

import { isCollaboratorSession, type AppSession } from '../../lib/auth';

/**
 * Dashboard entrypoint automatically redirects authenticated collaborators to the internal portal.
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

    const resolveAccess = async () => {
      const hasRealmCollaboratorPortal = isCollaboratorSession(typedSession);

      try {
        const response = await fetch('/api/auth/access-context', {
          cache: 'no-store',
        });
        const accessContext = await response.json();
        const hasCollaboratorPortal = Boolean(accessContext?.hasCollaboratorPortal);

        if (hasCollaboratorPortal || hasRealmCollaboratorPortal) {
          router.replace('/colaborador/dashboard');
          return;
        }

        router.replace('/login?error=AccessDenied');
      } catch {
        router.replace('/login');
      }
    };

    void resolveAccess();
  }, [router, status, typedSession]);

  return (
    <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-muted/30 px-4 py-10">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-6 py-4 text-sm font-medium text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Redirecionando para o painel do colaborador…
      </div>
    </div>
  );
}
