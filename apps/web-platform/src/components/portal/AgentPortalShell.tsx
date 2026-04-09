'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  User,
  ClipboardList,
  Building2,
  CalendarDays,
  Inbox,
  ChevronRight,
  Loader2,
  Plus,
} from 'lucide-react';

import { apiFetch } from '../../lib/api';
import {
  formatAgentStatus,
  getDashboardHome,
  isAgentSession,
  type AppSession,
} from '../../lib/auth';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';

type AgentProfile = {
  id: string;
  name: string;
  email: string;
  status: string;
  vocationType?: string | null;
  city?: string | null;
  country?: string | null;
};

type AgentPortalContextValue = {
  agent: AgentProfile | null;
  isLoading: boolean;
  reloadAgent: () => Promise<void>;
};

const AgentPortalContext = createContext<AgentPortalContextValue | null>(null);

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

/**
 * AgentPortalShell centralizes access control, profile loading and navigation for agent routes.
 */
export function AgentPortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const typedSession = session as AppSession | null;
  const sessionName = typedSession?.user?.name ?? 'Agente';

  const loadAgent = async () => {
    if (!typedSession) {
      return;
    }

    setIsLoadingProfile(true);
    try {
      const profile = await apiFetch('/agents/me', { session: typedSession });
      setAgent(profile);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (status === 'authenticated' && !isAgentSession(typedSession)) {
      router.replace(getDashboardHome(typedSession));
    }
  }, [pathname, router, status, typedSession]);

  useEffect(() => {
    if (status === 'authenticated' && isAgentSession(typedSession)) {
      void loadAgent();
    }
  }, [status, typedSession?.accessToken, typedSession?.user?.email]);

  const navigation: NavItem[] = [
    { href: '/agent/dashboard',        label: 'Visão Geral',     icon: LayoutDashboard },
    { href: '/agent/profile',          label: 'Perfil',          icon: User },
    { href: '/agent/status',           label: 'Onboarding',      icon: ClipboardList },
    { href: '/agent/empreendimentos',  label: 'Empreendimentos', icon: Building2 },
    { href: '/agent/events',           label: 'Eventos',         icon: CalendarDays },
    { href: '/agent/service-requests', label: 'Solicitações',    icon: Inbox },
  ];

  const contextValue = useMemo<AgentPortalContextValue>(
    () => ({
      agent,
      isLoading: isLoadingProfile,
      reloadAgent: loadAgent,
    }),
    [agent, isLoadingProfile],
  );

  if (status === 'loading' || status === 'unauthenticated' || !isAgentSession(typedSession)) {
    return (
      <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-muted/30">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-6 py-4 text-sm font-medium text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Validando acesso do agente…
        </div>
      </div>
    );
  }

  return (
    <AgentPortalContext.Provider value={contextValue}>
      <div className="min-h-[calc(100vh-145px)] bg-muted/30">
        <div className="mx-auto grid min-h-[calc(100vh-145px)] max-w-[1520px] grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)]">

          {/* ── Sidebar ── */}
          <aside className="border-r border-border bg-background px-4 py-6">
            {/* Profile card */}
            <div className="rounded-xl border border-border bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-sm font-bold text-primary-foreground">
                    {(agent?.name ?? sessionName).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {agent?.name ?? sessionName}
                  </p>
                  <p className="truncate text-xs text-slate-400">Portal do agente</p>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                <Badge variant="secondary" className="w-fit border-white/10 bg-white/5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  {formatAgentStatus(agent?.status)}
                </Badge>
                {agent?.vocationType && (
                  <p className="text-[11px] text-slate-400">{agent.vocationType}</p>
                )}
              </div>
            </div>

            <Separator className="my-5" />

            {/* Navigation */}
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </span>
                    <ChevronRight
                      className={cn(
                        'h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60',
                        isActive && 'opacity-60',
                      )}
                    />
                  </Link>
                );
              })}
            </nav>

            <Separator className="my-5" />

            {/* Quick actions */}
            <div className="space-y-1.5">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Ações rápidas
              </p>
              <Link
                href="/onboarding"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Preencher onboarding
              </Link>
              <Link
                href="/agent/empreendimentos/create"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova iniciativa
              </Link>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex min-w-0 flex-col">
            <header className="border-b border-border bg-background px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Globus Dei · Portal do agente
                  </p>
                  <h1 className="mt-0.5 text-base font-semibold text-foreground">
                    {agent?.city || agent?.country
                      ? `${agent?.city ?? 'Base local'} · ${agent?.country ?? 'Atuação global'}`
                      : 'Acompanhe seu avanço operacional'}
                  </h1>
                </div>
              </div>
            </header>

            <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : (
                children
              )}
            </main>
          </div>
        </div>
      </div>
    </AgentPortalContext.Provider>
  );
}

/**
 * useAgentPortal provides the authenticated agent profile to nested pages.
 */
export function useAgentPortal() {
  const context = useContext(AgentPortalContext);

  if (!context) {
    throw new Error('useAgentPortal must be used inside AgentPortalShell.');
  }

  return context;
}
