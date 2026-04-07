'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiFetch } from '../../lib/api';
import {
  formatCollaboratorRole,
  getCollaboratorPermissions,
  getDashboardHome,
  isCollaboratorSession,
  type AppSession,
  type CollaboratorPermissions,
  type CollaboratorProfile,
} from '../../lib/auth';

type CollaboratorPortalContextValue = {
  collaborator: CollaboratorProfile | null;
  permissions: CollaboratorPermissions;
  isLoading: boolean;
  reloadCollaborator: () => Promise<void>;
};

const CollaboratorPortalContext = createContext<CollaboratorPortalContextValue | null>(null);

/**
 * CollaboratorPortalShell centralizes collaborator profile loading and feature gating.
 */
export function CollaboratorPortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [collaborator, setCollaborator] = useState<CollaboratorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const typedSession = session as AppSession | null;
  const sessionName = typedSession?.user?.name ?? 'Colaborador';

  const loadCollaborator = async () => {
    if (!typedSession) {
      return;
    }

    setIsLoadingProfile(true);
    try {
      const profile = await apiFetch('/collaborators/me', { session: typedSession });
      setCollaborator(profile);
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

    if (status === 'authenticated' && !isCollaboratorSession(typedSession)) {
      router.replace(getDashboardHome(typedSession));
    }
  }, [pathname, router, status, typedSession]);

  useEffect(() => {
    if (status === 'authenticated' && isCollaboratorSession(typedSession)) {
      void loadCollaborator();
    }
  }, [status, typedSession?.accessToken, typedSession?.user?.email]);

  const permissions = useMemo(
    () => getCollaboratorPermissions(collaborator),
    [collaborator],
  );

  const navigation = [
    { href: '/colaborador/dashboard', label: 'Visão Geral', visible: true },
    {
      href: '/colaborador/empreendimentos',
      label: 'Empreendimentos',
      visible: permissions.canManageProjects,
    },
    {
      href: '/colaborador/service-requests',
      label: 'Solicitações',
      visible: permissions.canManageRequests,
    },
    {
      href: '/colaborador/announcements',
      label: 'Conteúdo',
      visible: true,
    },
    {
      href: '/colaborador/finance',
      label: permissions.canManageFinance ? 'Financeiro' : 'Financeiro (Leitura)',
      visible: permissions.canViewFinance,
    },
  ];

  const contextValue = useMemo<CollaboratorPortalContextValue>(
    () => ({
      collaborator,
      permissions,
      isLoading: isLoadingProfile,
      reloadCollaborator: loadCollaborator,
    }),
    [collaborator, isLoadingProfile, permissions],
  );

  if (status === 'loading' || status === 'unauthenticated' || !isCollaboratorSession(typedSession)) {
    return (
      <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-sm font-semibold text-slate-500 shadow-sm">
          Validando acesso do colaborador...
        </div>
      </div>
    );
  }

  return (
    <CollaboratorPortalContext.Provider value={contextValue}>
      <div className="min-h-[calc(100vh-145px)] bg-slate-100">
        <div className="mx-auto grid min-h-[calc(100vh-145px)] max-w-[1520px] grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-r border-slate-200 bg-white px-6 py-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-2xl font-black text-blue-200">
                {(collaborator?.name ?? sessionName).charAt(0)}
              </div>
              <div className="text-lg font-bold">{collaborator?.name ?? sessionName}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(collaborator?.roles ?? []).length > 0 ? (
                  collaborator?.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-200"
                    >
                      {formatCollaboratorRole(role)}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-amber-400/20 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
                    Perfil sem papéis locais
                  </span>
                )}
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              {navigation
                .filter((item) => item.visible)
                .map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </nav>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                Observações
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                As ações de escrita seguem os papéis locais do colaborador. O frontend replica essa regra para
                evitar fluxos inconsistentes com o backend.
              </p>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col">
            <header className="border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                    Portal do colaborador
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-900">
                    Operação interna, governança e acompanhamento da plataforma
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
    </CollaboratorPortalContext.Provider>
  );
}

/**
 * useCollaboratorPortal exposes the local collaborator profile and permissions to portal pages.
 */
export function useCollaboratorPortal() {
  const context = useContext(CollaboratorPortalContext);

  if (!context) {
    throw new Error('useCollaboratorPortal must be used inside CollaboratorPortalShell.');
  }

  return context;
}
