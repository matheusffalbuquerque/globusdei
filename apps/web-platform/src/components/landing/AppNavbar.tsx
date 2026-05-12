'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  Briefcase,
  Building2,
  GraduationCap,
  Home,
  LogOut,
  Users,
} from 'lucide-react';

import { apiFetch } from '../../lib/api';
import {
  isAgentSession,
  isCollaboratorSession,
  getDashboardHome,
  type AppSession,
} from '../../lib/auth';
import { NOTIFICATION_UNREAD_COUNT_CHANGED_EVENT } from '../../lib/notification-events';
import { useIsMobileViewport } from '../../hooks/useIsMobileViewport';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';
import { formatUnreadNotificationCount } from '../notifications/NotificationUnreadBadge';

type NavLinkItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
};

const MOBILE_NAV_LABELS = new Set(['Rede Global', 'Academia']);

/**
 * AppNavbar renders a public bar when logged out and a LinkedIn-style top nav when logged in.
 */
export function AppNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const typedSession = session as AppSession | null;
  const isLoggedIn = status === 'authenticated' && !!session;
  const isMobile = useIsMobileViewport();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const realmRolesKey = typedSession?.user?.realmRoles?.join('|') ?? '';

  /**
   * loadUnreadNotificationCount feeds the top notification icon badge for each portal role.
   */
  const loadUnreadNotificationCount = useCallback(async () => {
    if (!typedSession || status !== 'authenticated') {
      setUnreadNotificationCount(0);
      return;
    }

    const endpoint = isAgentSession(typedSession)
      ? '/notifications/agent/unread-count'
      : isCollaboratorSession(typedSession)
        ? '/notifications/collaborator/unread-count'
        : null;

    if (!endpoint) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const result = await apiFetch(endpoint, {
        service: 'notification',
        session: typedSession,
      });
      setUnreadNotificationCount(Number(result?.count ?? 0));
    } catch {
      setUnreadNotificationCount(0);
    }
  }, [
    status,
    typedSession?.accessToken,
    typedSession?.user?.email,
    realmRolesKey,
  ]);

  useEffect(() => {
    if (!typedSession || !isAgentSession(typedSession)) {
      setPhotoUrl(null);
      return;
    }

    apiFetch('/agents/me', { session: typedSession })
      .then((profile) => setPhotoUrl(profile.photoUrl ?? null))
      .catch(() => setPhotoUrl(null));
  }, [typedSession?.accessToken, typedSession?.user?.email]);

  useEffect(() => {
    void loadUnreadNotificationCount();
  }, [loadUnreadNotificationCount, pathname]);

  useEffect(() => {
    const refreshUnreadBadge = () => {
      void loadUnreadNotificationCount();
    };

    window.addEventListener(
      NOTIFICATION_UNREAD_COUNT_CHANGED_EVENT,
      refreshUnreadBadge,
    );
    window.addEventListener('focus', refreshUnreadBadge);

    return () => {
      window.removeEventListener(
        NOTIFICATION_UNREAD_COUNT_CHANGED_EVENT,
        refreshUnreadBadge,
      );
      window.removeEventListener('focus', refreshUnreadBadge);
    };
  }, [loadUnreadNotificationCount]);

  /* ── Loading skeleton ── */
  if (status === 'loading') {
    return (
      <div className="sticky top-0 z-50 h-14 border-b border-border bg-white/95 backdrop-blur-sm" />
    );
  }

  /* ── Logged-out: simple public bar ── */
  if (!isLoggedIn) {
    return (
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Globus Dei Logo"
              className="h-10 w-auto"
            />
            <span className="font-display text-2xl font-semibold text-primary">
              Globus Dei
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a
              href="#"
              className="text-slate-700 transition-colors hover:text-primary"
            >
              Rede Global
            </a>
            <a
              href="#"
              className="text-slate-700 transition-colors hover:text-primary"
            >
              Projetos
            </a>
            <a
              href="#"
              className="text-slate-700 transition-colors hover:text-primary"
            >
              Oportunidades
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-95"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </header>
    );
  }

  /* ── Build nav items per role ── */
  const dashboardHome = isLoggedIn
    ? '/dashboard'
    : getDashboardHome(typedSession);
  const userName = typedSession?.user?.name ?? 'Usuário';
  const userInitial = userName.charAt(0).toUpperCase();
  const isChoosingPortal = pathname === '/dashboard';
  const notificationBadge =
    unreadNotificationCount > 0 ? unreadNotificationCount : undefined;

  let navItems: NavLinkItem[];

  if (isAgentSession(typedSession)) {
    navItems = [
      { href: '/agent/dashboard', label: 'Início', icon: Home },
      { href: '/agent/network', label: 'Rede Global', icon: Users },
      { href: '/agent/academy', label: 'Academia', icon: GraduationCap },
      {
        href: '/agent/service-requests',
        label: 'Oportunidades',
        icon: Briefcase,
      },
      {
        href: '/agent/notifications',
        label: 'Notificações',
        icon: Bell,
        badge: notificationBadge,
      },
    ];
  } else if (isCollaboratorSession(typedSession)) {
    navItems = [
      { href: '/colaborador/dashboard', label: 'Início', icon: Home },
      {
        href: '/colaborador/empreendimentos',
        label: 'Rede Global',
        icon: Building2,
      },
      { href: '/colaborador/academy', label: 'Academia', icon: GraduationCap },
      {
        href: '/colaborador/service-requests',
        label: 'Oportunidades',
        icon: Briefcase,
      },
      {
        href: '/colaborador/notifications',
        label: 'Notificações',
        icon: Bell,
        badge: notificationBadge,
      },
    ];
  } else {
    navItems = [{ href: dashboardHome, label: 'Início', icon: Home }];
  }

  const mobileNavItems = navItems.filter((item) =>
    MOBILE_NAV_LABELS.has(item.label),
  );

  /* ── Logged-in: LinkedIn-style top bar ── */
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full items-stretch justify-between gap-3 px-4">
        {/* Logo */}
        <Link href={dashboardHome} className="flex shrink-0 items-center gap-3">
          <img src="/logo.png" alt="Globus Dei" className="h-10 w-auto" />
          {!isMobile && (
            <span className="font-display text-2xl font-semibold text-primary">
              Globus Dei
            </span>
          )}
        </Link>

        {isMobile ? (
          <nav className="flex min-w-0 items-center gap-1">
            {mobileNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={isChoosingPortal ? '#' : item.href}
                  aria-disabled={isChoosingPortal}
                  onClick={(event) => {
                    if (isChoosingPortal) {
                      event.preventDefault();
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                    isChoosingPortal
                      ? 'cursor-not-allowed text-muted-foreground/50'
                      : isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="flex items-stretch gap-0">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const badgeLabel = formatUnreadNotificationCount(item.badge ?? 0);
              return (
                <Link
                  key={item.href}
                  href={isChoosingPortal ? '#' : item.href}
                  aria-disabled={isChoosingPortal}
                  onClick={(event) => {
                    if (isChoosingPortal) {
                      event.preventDefault();
                    }
                  }}
                  className={cn(
                    'relative flex w-24 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                    isChoosingPortal
                      ? 'cursor-not-allowed text-muted-foreground/50'
                      : isActive
                        ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {badgeLabel && (
                      <span
                        aria-label={`${badgeLabel} notificações não lidas`}
                        className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white"
                      >
                        {badgeLabel}
                      </span>
                    )}
                  </span>
                  <span className="leading-none">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right: avatar + sign out */}
        <div className="flex shrink-0 items-center gap-2">
          <Avatar className="h-8 w-8">
            {photoUrl ? <AvatarImage src={photoUrl} alt={userName} /> : null}
            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            title="Sair"
            onClick={() => void signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {!isMobile && <span>Sair</span>}
          </button>
        </div>
      </div>

      {isChoosingPortal && (
        <div className="border-t border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs font-medium text-amber-900">
          Escolha primeiro se deseja entrar como agente ou colaborador para
          liberar a navegação.
        </div>
      )}
    </header>
  );
}
