'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Inbox,
  Megaphone,
  BadgeDollarSign,
  CalendarDays,
  ClipboardList,
  HandHeart,
  Bell,
  ChevronRight,
  Loader2,
  TrendingUp,
  ScrollText,
} from 'lucide-react';

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
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';

// ─── Context ─────────────────────────────────────────────────────────────────

type CollaboratorPortalContextValue = {
  collaborator: CollaboratorProfile | null;
  permissions: CollaboratorPermissions;
  isLoading: boolean;
  reloadCollaborator: () => Promise<void>;
};

const CollaboratorPortalContext = createContext<CollaboratorPortalContextValue | null>(null);

// ─── Nav item definition ──────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  visible: boolean;
  badge?: string;
};

// ─── Shell ────────────────────────────────────────────────────────────────────

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
    if (!typedSession) return;
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

  const navigation: NavItem[] = [
    {
      href: '/colaborador/dashboard',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      href: '/colaborador/empreendimentos',
      label: 'Empreendimentos',
      icon: Building2,
      visible: permissions.canManageProjects,
    },
    {
      href: '/colaborador/service-requests',
      label: 'Solicitações',
      icon: Inbox,
      visible: permissions.canManageRequests,
    },
    {
      href: '/colaborador/announcements',
      label: 'Anúncios',
      icon: Megaphone,
      visible: true,
    },
    {
      href: '/colaborador/opportunities',
      label: 'Oportunidades',
      icon: Briefcase,
      visible: true,
    },
    {
      href: '/colaborador/investments',
      label: 'Investimentos',
      icon: TrendingUp,
      visible: permissions.canViewFinance,
    },
    {
      href: '/colaborador/events',
      label: 'Eventos',
      icon: CalendarDays,
      visible: true,
    },
    {
      href: '/colaborador/prayer-requests',
      label: 'Intercessão',
      icon: HandHeart,
      visible: true,
    },
    {
      href: '/colaborador/notifications',
      label: 'Notificações',
      icon: Bell,
      visible: true,
    },
    {
      href: '/colaborador/finance',
      label: 'Financeiro',
      icon: BadgeDollarSign,
      visible: permissions.canViewFinance,
      badge: !permissions.canManageFinance ? 'Leitura' : undefined,
    },
    {
      href: '/colaborador/onboarding',
      label: 'Onboarding',
      icon: ClipboardList,
      visible: permissions.canManageOnboarding,
    },
    {
      href: '/colaborador/logs',
      label: 'Logs da Plataforma',
      icon: ScrollText,
      visible: permissions.isAdmin,
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

  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    !isCollaboratorSession(typedSession)
  ) {
    return (
      <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-muted/30">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-6 py-4 text-sm font-medium text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Validando acesso do colaborador…
        </div>
      </div>
    );
  }

  return (
    <CollaboratorPortalContext.Provider value={contextValue}>
      <div className="min-h-[calc(100vh-145px)] bg-muted/30">
        <div className="mx-auto grid min-h-[calc(100vh-145px)] max-w-[1520px] grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)]">

          {/* ── Sidebar ── */}
          <aside className="border-r border-border bg-background px-4 py-6">
            {/* Profile card */}
            <div className="rounded-xl border border-border bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-sm font-bold text-primary-foreground">
                    {(collaborator?.name ?? sessionName).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {collaborator?.name ?? sessionName}
                  </p>
                  <p className="truncate text-xs text-slate-400">Portal do colaborador</p>
                </div>
              </div>

              {(collaborator?.roles ?? []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {collaborator?.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300"
                    >
                      {formatCollaboratorRole(role)}
                    </span>
                  ))}
                </div>
              )}

              {(collaborator?.roles ?? []).length === 0 && (
                <div className="mt-3">
                  <span className="rounded-md border border-amber-400/20 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    Sem papéis locais
                  </span>
                </div>
              )}
            </div>

            <Separator className="my-5" />

            {/* Navigation */}
            <nav className="space-y-1">
              {navigation
                .filter((item) => item.visible)
                .map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                      <span className="flex items-center gap-1.5">
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'px-1.5 py-0 text-[10px]',
                              isActive && 'bg-white/20 text-white',
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight
                          className={cn(
                            'h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60',
                            isActive && 'opacity-60',
                          )}
                        />
                      </span>
                    </Link>
                  );
                })}
            </nav>
          </aside>

          {/* ── Main content ── */}
          <div className="flex min-w-0 flex-col">
            <header className="border-b border-border bg-background px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Globus Dei · Portal interno
                  </p>
                  <h1 className="mt-0.5 text-base font-semibold text-foreground">
                    Operação, governança e acompanhamento
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
