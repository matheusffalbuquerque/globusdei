'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, Building2, Loader2, ShieldCheck, Users } from 'lucide-react';

import { apiFetch } from '../../lib/api';
import {
  isAgentSession,
  isCollaboratorSession,
  type AppSession,
} from '../../lib/auth';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

type CollaboratorProfileResponse = {
  authenticated?: boolean;
  hasAgentPortal?: boolean;
  hasCollaboratorPortal?: boolean;
};

/**
 * Dashboard entrypoint resolves the available portals after login using the
 * same client session and API access path used by the rest of the application.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const typedSession = session as AppSession | null;

  const [loadingAccess, setLoadingAccess] = useState(true);
  const [hasLocalCollaboratorAccess, setHasLocalCollaboratorAccess] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard');
      return;
    }

    const resolveAccess = async () => {
      const hasAgentPortal = isAgentSession(typedSession);
      const hasRealmCollaboratorPortal = isCollaboratorSession(typedSession);

      if (!hasAgentPortal && !hasRealmCollaboratorPortal) {
        router.replace('/login');
        return;
      }

      try {
        const accessContext = (await fetch('/api/auth/access-context', {
          cache: 'no-store',
        }).then((response) => response.json())) as CollaboratorProfileResponse;

        const hasCollaboratorPortal = Boolean(accessContext?.hasCollaboratorPortal);
        setHasLocalCollaboratorAccess(hasCollaboratorPortal);

        if (hasAgentPortal && hasCollaboratorPortal) {
          setLoadingAccess(false);
          return;
        }

        if (hasCollaboratorPortal || hasRealmCollaboratorPortal) {
          router.replace('/colaborador/dashboard');
          return;
        }

        if (hasAgentPortal) {
          router.replace('/agent/dashboard');
          return;
        }
      } catch {
        if (hasAgentPortal) {
          router.replace('/agent/dashboard');
          return;
        }

        router.replace('/login');
      } finally {
        setLoadingAccess(false);
      }
    };

    void resolveAccess();
  }, [router, status, typedSession]);

  const hasAgentPortal = isAgentSession(typedSession);
  const hasCollaboratorPortal =
    isCollaboratorSession(typedSession) || hasLocalCollaboratorAccess;

  if (status === 'loading' || loadingAccess) {
    return (
      <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-muted/30 px-4 py-10">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-6 py-4 text-sm font-medium text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Identificando ambientes disponíveis…
        </div>
      </div>
    );
  }

  if (!(hasAgentPortal && hasCollaboratorPortal)) {
    return null;
  }

  const userName = typedSession?.user?.name?.split(' ')[0] ?? 'Usuário';

  return (
    <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-muted/30 px-4 py-6">
      <div className="w-full max-w-4xl space-y-5">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Acesso à plataforma
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Como deseja entrar, {userName}?
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha o ambiente para continuar.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Entrar como agente</CardTitle>
                <CardDescription className="mt-1">
                  Ambiente missionário e rede global.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full">
                <Link href="/agent/dashboard">
                  Continuar como agente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Entrar como colaborador</CardTitle>
                <CardDescription className="mt-1">
                  Ambiente interno da equipe Globus Dei.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild variant="outline" className="w-full">
                <Link href="/colaborador/dashboard">
                  Continuar como colaborador
                  <Building2 className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
