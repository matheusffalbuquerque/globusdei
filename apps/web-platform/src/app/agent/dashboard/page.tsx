'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarClock,
  Inbox,
  TrendingUp,
  Users,
} from 'lucide-react';

import { useAgentPortal } from '../../../components/portal/AgentPortalShell';
import { apiFetch } from '../../../lib/api';
import {
  formatAgentStatus,
  formatServiceRequestCategory,
  formatServiceRequestStatus,
  type AppSession,
} from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

type DashboardData = {
  connections: number;
  following: number;
  announcements: {
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: string;
  }[];
  serviceRequests: {
    id: string;
    category: string;
    status: string;
    description: string;
    createdAt: string;
  }[];
  empreendimentos: {
    id: string;
    name: string;
    category: string;
    type: string;
  }[];
};

function announcementTypeVariant(type: string) {
  const t = type?.toUpperCase();
  if (t === 'URGENTE' || t === 'URGENT') return 'destructive' as const;
  if (t === 'IMPORTANTE' || t === 'IMPORTANT') return 'warning' as const;
  return 'secondary' as const;
}

function requestStatusVariant(status: string) {
  const s = status?.toUpperCase();
  if (s === 'OPEN') return 'info' as const;
  if (s === 'IN_PROGRESS') return 'warning' as const;
  if (s === 'RESOLVED' || s === 'CLOSED') return 'success' as const;
  return 'secondary' as const;
}

/**
 * AgentDashboard presents the operational cockpit for an authenticated agent.
 */
export default function AgentDashboard() {
  const { data: session } = useSession();
  const { agent } = useAgentPortal();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    void apiFetch('/agents/me/dashboard', { session: session as AppSession })
      .then(setDashboard)
      .catch((requestError) => setError((requestError as Error).message));
  }, [session]);

  const onboardingAlert = useMemo(() => {
    if (!agent?.status) {
      return {
        title: 'Complete seu cadastro operacional',
        description: 'Preencha o onboarding para liberar análise e próximos passos.',
        href: '/onboarding',
        cta: 'Abrir onboarding',
      };
    }
    if (agent.status === 'ENTERED' || agent.status === 'REJECTED') {
      return {
        title: 'Há ações pendentes no seu onboarding',
        description:
          agent.status === 'REJECTED'
            ? 'Sua análise retornou com ajustes. Reenvie o questionário.'
            : 'Seu questionário ainda não foi submetido para análise.',
        href: '/onboarding',
        cta: 'Resolver agora',
      };
    }
    if (agent.status === 'QUALIFIED') {
      return {
        title: 'Você já pode agendar sua entrevista',
        description: 'Escolha um horário disponível para avançar no fluxo de aprovação.',
        href: '/agent/status',
        cta: 'Agendar horário',
      };
    }
    return null;
  }, [agent?.status]);

  const kpis = [
    { label: 'Conexões ativas', value: dashboard?.connections ?? 0, icon: Users },
    { label: 'Iniciativas acompanhadas', value: dashboard?.following ?? 0, icon: TrendingUp },
    { label: 'Solicitações abertas', value: dashboard?.serviceRequests?.length ?? 0, icon: Inbox },
    { label: 'Empreendimentos vinculados', value: dashboard?.empreendimentos?.length ?? 0, icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Visão geral
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {agent?.name ? `Olá, ${agent.name.split(' ')[0]}` : 'Olá'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Acompanhe seu avanço no onboarding, conexões, iniciativas e demandas abertas.
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-border bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Status atual
            </p>
            <p className="mt-1.5 text-base font-semibold text-white">
              {formatAgentStatus(agent?.status)}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {agent?.vocationType || 'Vocação ainda não informada'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding alert */}
      {onboardingAlert && (
        <div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                Ação prioritária
              </p>
              <h2 className="mt-0.5 text-sm font-semibold text-foreground">
                {onboardingAlert.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{onboardingAlert.description}</p>
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href={onboardingAlert.href}>{onboardingAlert.cta}</Link>
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* KPI grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {kpi.label}
                  </p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                  {kpi.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Announcements + right column */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Announcements */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Comunicação oficial
              </p>
              <CardTitle className="mt-0.5 text-base">Anúncios e atualizações</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <Link href="/agent/service-requests">
                <Bell className="mr-1.5 h-3.5 w-3.5" />
                Minhas demandas
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard?.announcements ?? []).length > 0 ? (
              dashboard?.announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant={announcementTypeVariant(announcement.type)}>
                      {announcement.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    {announcement.title}
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {announcement.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum anúncio recente publicado para a sua rede.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Service requests preview */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Solicitações recentes</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <Link href="/agent/service-requests">Gerenciar</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(dashboard?.serviceRequests ?? []).length > 0 ? (
                dashboard?.serviceRequests.slice(0, 4).map((request) => (
                  <div key={request.id} className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {formatServiceRequestCategory(request.category)}
                      </p>
                      <Badge variant={requestStatusVariant(request.status)} className="text-[10px]">
                        {formatServiceRequestStatus(request.status)}
                      </Badge>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                      {request.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma solicitação registrada.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Empreendimentos preview */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Empreendimentos</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <Link href="/agent/empreendimentos">
                  <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                  Abrir gestão
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(dashboard?.empreendimentos ?? []).length > 0 ? (
                dashboard?.empreendimentos.slice(0, 4).map((empreendimento) => (
                  <div key={empreendimento.id} className="rounded-lg bg-muted/30 p-3">
                    <p className="text-sm font-medium text-foreground">{empreendimento.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {empreendimento.type} · {empreendimento.category}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Você ainda não possui empreendimentos vinculados.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
