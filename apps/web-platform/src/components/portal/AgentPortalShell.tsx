'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiFetch } from '../../lib/api';
import {
  formatAgentStatus,
  getDashboardHome,
  isAgentSession,
  type AppSession,
} from '../../lib/auth';

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

  const navigation = [
    { href: '/agent/dashboard', label: 'Visão Geral' },
    { href: '/agent/profile', label: 'Perfil' },
    { href: '/agent/status', label: 'Onboarding' },
    { href: '/agent/empreendimentos', label: 'Empreendimentos' },
    { href: '/agent/service-requests', label: 'Solicitações' },
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
      <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-sm font-semibold text-slate-500 shadow-sm">
          Validando acesso do agente...
        </div>
      </div>
    );
  }

  return (
    <AgentPortalContext.Provider value={contextValue}>
      <div className="min-h-[calc(100vh-145px)] bg-slate-100">
        <div className="mx-auto grid min-h-[calc(100vh-145px)] max-w-[1440px] grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-r border-slate-200 bg-slate-950 px-6 py-8 text-white">
            <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15 text-2xl font-black text-orange-200">
                {(agent?.name ?? sessionName).charAt(0)}
              </div>
              <div className="text-lg font-bold">{agent?.name ?? sessionName}</div>
              <div className="mt-1 text-sm text-slate-300">
                {agent?.vocationType || 'Perfil em construção'}
              </div>
              <div className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
                {formatAgentStatus(agent?.status)}
              </div>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                Ações rápidas
              </div>
              <div className="mt-4 space-y-2">
                <Link href="/onboarding" className="block rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100">
                  Preencher onboarding
                </Link>
                <Link href="/agent/empreendimentos/create" className="block rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100">
                  Nova iniciativa
                </Link>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col">
            <header className="border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                    Portal do agente
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-900">
                    {agent?.city || agent?.country
                      ? `${agent?.city ?? 'Base local'}, ${agent?.country ?? 'Atuação global'}`
                      : 'Acompanhe seu avanço operacional'}
                  </div>
                </div>


              </div>
            </header>

            <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
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
