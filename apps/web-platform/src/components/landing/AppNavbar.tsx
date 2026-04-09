'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Bell,
  Briefcase,
  Building2,
  Home,
  LogOut,
  MessageSquare,
  Users,
} from 'lucide-react';

import { isAgentSession, isCollaboratorSession, getDashboardHome, type AppSession } from '../../lib/auth';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '../../lib/utils';

type NavLinkItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
};

/**
 * AppNavbar renders a public bar when logged out and a LinkedIn-style top nav when logged in.
 */
export function AppNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const typedSession = session as AppSession | null;
  const isLoggedIn = status === 'authenticated' && !!session;

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
            <img src="/logo.png" alt="Globus Dei Logo" className="h-10 w-auto" />
            <span className="font-display text-2xl font-semibold text-primary">Globus Dei</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#" className="text-slate-700 transition-colors hover:text-primary">
              Rede Global
            </a>
            <a href="#" className="text-slate-700 transition-colors hover:text-primary">
              Projetos
            </a>
            <a href="#" className="text-slate-700 transition-colors hover:text-primary">
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
  const dashboardHome = getDashboardHome(typedSession);
  const userName = typedSession?.user?.name ?? 'Usuário';
  const userInitial = userName.charAt(0).toUpperCase();

  let navItems: NavLinkItem[];

  if (isAgentSession(typedSession)) {
    navItems = [
      { href: '/agent/dashboard',        label: 'Início',          icon: Home },
      { href: '/agent/empreendimentos',   label: 'Minha rede',      icon: Users },
      { href: '/agent/service-requests',  label: 'Solicitações',    icon: Briefcase },
      { href: '/agent/profile',           label: 'Mensagens',       icon: MessageSquare },
      { href: '/agent/status',            label: 'Notificações',    icon: Bell },
    ];
  } else if (isCollaboratorSession(typedSession)) {
    navItems = [
      { href: '/colaborador/dashboard',         label: 'Início',       icon: Home },
      { href: '/colaborador/empreendimentos',    label: 'Projetos',     icon: Building2 },
      { href: '/colaborador/service-requests',   label: 'Solicitações', icon: Briefcase },
      { href: '/colaborador/profile',            label: 'Mensagens',    icon: MessageSquare },
      { href: '/colaborador/notifications',      label: 'Notificações', icon: Bell },
    ];
  } else {
    navItems = [
      { href: dashboardHome, label: 'Início', icon: Home },
    ];
  }

  /* ── Logged-in: LinkedIn-style top bar ── */
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href={dashboardHome} className="flex shrink-0 items-center gap-3">
          <img src="/logo.png" alt="Globus Dei" className="h-10 w-auto" />
          <span className="font-display text-2xl font-semibold text-primary">Globus Dei</span>
        </Link>

        {/* Nav items */}
        <nav className="flex items-stretch gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex min-w-[64px] flex-col items-center justify-center gap-0.5 px-3 pb-2 pt-2 text-[11px] font-medium transition-colors',
                  isActive
                    ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: avatar + sign out */}
        <div className="flex shrink-0 items-center gap-3">
          <Avatar className="h-8 w-8">
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
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
