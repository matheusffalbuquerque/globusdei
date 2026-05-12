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
  User,
  ClipboardList,
  Building2,
  Briefcase,
  CalendarDays,
  HandHeart,
  Inbox,
  Bell,
  ChevronRight,
  Loader2,
  Plus,
  TrendingUp,
  Menu,
} from 'lucide-react';

import { apiFetch } from '../../lib/api';
import {
  formatAgentStatus,
  getDashboardHome,
  isAgentSession,
  type AppSession,
} from '../../lib/auth';
import { useIsMobileViewport } from '../../hooks/useIsMobileViewport';
import { NotificationUnreadBadge } from '../notifications/NotificationUnreadBadge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';

type AgentProfile = {
  id: string;
  name: string;
  email: string;
  status: string;
  photoUrl?: string | null;
  city?: string | null;
  country?: string | null;
};

type AgentPortalContextValue = {
  agent: AgentProfile | null;
  isLoading: boolean;
  reloadAgent: () => Promise<void>;
  unreadNotificationCount: number;
  reloadNotificationCount: () => Promise<void>;
};

const AgentPortalContext = createContext<AgentPortalContextValue | null>(null);

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  unreadCount?: number;
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
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const typedSession = session as AppSession | null;
  const sessionName = typedSession?.user?.name ?? 'Agente';
  const isMobile = useIsMobileViewport();

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

  /**
   * loadUnreadNotificationCount keeps the notification menu badge in sync without blocking the shell.
   */
  const loadUnreadNotificationCount = async () => {
    if (!typedSession) {
      return;
    }

    try {
      const result = await apiFetch('/notifications/agent/unread-count', {
        service: 'notification',
        session: typedSession,
      });
      setUnreadNotificationCount(Number(result?.count ?? 0));
    } catch {
      setUnreadNotificationCount(0);
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
      void loadUnreadNotificationCount();
    }
  }, [status, typedSession?.accessToken, typedSession?.user?.email]);

  const navigation: NavItem[] = [
    { href: '/agent/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { href: '/agent/profile', label: 'Perfil', icon: User },
    { href: '/agent/status', label: 'Onboarding', icon: ClipboardList },
    {
      href: '/agent/empreendimentos',
      label: 'Empreendimentos',
      icon: Building2,
    },
    { href: '/agent/opportunities', label: 'Oportunidades', icon: Briefcase },
    { href: '/agent/investments', label: 'Investimentos', icon: TrendingUp },
    { href: '/agent/events', label: 'Eventos', icon: CalendarDays },
    { href: '/agent/prayer-requests', label: 'Intercessão', icon: HandHeart },
    { href: '/agent/service-requests', label: 'Solicitações', icon: Inbox },
    {
      href: '/agent/notifications',
      label: 'Notificações',
      icon: Bell,
      unreadCount: unreadNotificationCount,
    },
  ];

  const contextValue = useMemo<AgentPortalContextValue>(
    () => ({
      agent,
      isLoading: isLoadingProfile,
      reloadAgent: loadAgent,
      unreadNotificationCount,
      reloadNotificationCount: loadUnreadNotificationCount,
    }),
    [
      agent,
      isLoadingProfile,
      unreadNotificationCount,
      typedSession?.accessToken,
      typedSession?.user?.email,
    ],
  );

  const renderSidebarContent = (closeOnNavigate: boolean) => (
    <>
      <div className="rounded-xl border border-border bg-slate-950 p-4 text-white">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            {agent?.photoUrl ? (
              <AvatarImage src={agent.photoUrl} alt={agent.name} />
            ) : null}
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
          <Badge
            variant="secondary"
            className="w-fit border-white/10 bg-white/5 text-[10px] font-semibold uppercase tracking-wider text-slate-300"
          >
            {formatAgentStatus(agent?.status)}
          </Badge>
        </div>
      </div>

      <Separator className="my-5" />

      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const link = (
            <Link
              href={item.href}
              className={cn(
                'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                <NotificationUnreadBadge
                  count={item.unreadCount ?? 0}
                  active={isActive}
                />
              </span>
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60',
                  isActive && 'opacity-60',
                )}
              />
            </Link>
          );

          return closeOnNavigate ? (
            <DialogClose asChild key={item.href}>
              {link}
            </DialogClose>
          ) : (
            <div key={item.href}>{link}</div>
          );
        })}
      </nav>

      <Separator className="my-5" />

      <div className="space-y-1.5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Ações rápidas
        </p>
        {closeOnNavigate ? (
          <DialogClose asChild>
            <Link
              href="/onboarding"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Preencher onboarding
            </Link>
          </DialogClose>
        ) : (
          <Link
            href="/onboarding"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Preencher onboarding
          </Link>
        )}
        {closeOnNavigate ? (
          <DialogClose asChild>
            <Link
              href="/agent/empreendimentos/create"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova iniciativa
            </Link>
          </DialogClose>
        ) : (
          <Link
            href="/agent/empreendimentos/create"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova iniciativa
          </Link>
        )}
      </div>
    </>
  );

  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    !isAgentSession(typedSession)
  ) {
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
        <div
          className={cn(
            'mx-auto min-h-[calc(100vh-145px)] max-w-[1520px]',
            isMobile ? 'block' : 'flex',
          )}
        >
          {/* ── Sidebar ── */}
          {!isMobile && (
            <aside className="portal-shell-sidebar border-r border-border bg-background px-4 py-6">
              {renderSidebarContent(false)}
            </aside>
          )}

          {/* ── Main content ── */}
          <div className="flex min-w-0 flex-1 flex-col">
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
                {isMobile && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                        aria-label="Abrir menu"
                      >
                        <Menu className="h-4 w-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="left-auto right-0 top-0 bottom-0 flex h-dvh w-[80vw] max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 border-l border-border p-0">
                      <DialogHeader className="shrink-0 px-5 pb-3 pt-5 text-left">
                        <DialogTitle>Menu</DialogTitle>
                      </DialogHeader>
                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
                        {renderSidebarContent(true)}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
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
