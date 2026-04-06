'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

import { useAgentPortal } from '../../../components/portal/AgentPortalShell';
import { apiFetch } from '../../../lib/api';
import {
  formatAgentStatus,
  formatServiceRequestCategory,
  formatServiceRequestStatus,
  type AppSession,
} from '../../../lib/auth';

type DashboardData = {
  connections: number;
  following: number;
  announcements: { id: string; title: string; content: string; type: string; createdAt: string }[];
  serviceRequests: { id: string; category: string; status: string; description: string; createdAt: string }[];
  empreendimentos: { id: string; name: string; category: string; type: string }[];
};

/**
 * AgentDashboard presents the operational cockpit for an authenticated agent.
 */
export default function AgentDashboard() {
  const { data: session } = useSession();
  const { agent } = useAgentPortal();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

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

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Visão geral</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {agent?.name ? `Olá, ${agent.name.split(' ')[0]}` : 'Olá'}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Acompanhe seu avanço no onboarding, suas conexões, iniciativas e as demandas abertas na plataforma.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Status atual</div>
            <div className="mt-2 text-lg font-bold">{formatAgentStatus(agent?.status)}</div>
            <div className="mt-1 text-sm text-slate-300">{agent?.vocationType || 'Vocação ainda não informada'}</div>
          </div>
        </div>
      </section>

      {onboardingAlert && (
        <section className="rounded-[32px] border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-orange-600">Ação prioritária</div>
              <h2 className="mt-2 text-xl font-bold text-slate-900">{onboardingAlert.title}</h2>
              <p className="mt-2 text-slate-600">{onboardingAlert.description}</p>
            </div>
            <Link
              href={onboardingAlert.href}
              className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white"
            >
              {onboardingAlert.cta}
            </Link>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Conexões ativas', value: dashboard?.connections ?? 0 },
          { label: 'Iniciativas acompanhadas', value: dashboard?.following ?? 0 },
          { label: 'Solicitações abertas', value: dashboard?.serviceRequests?.length ?? 0 },
          { label: 'Empreendimentos vinculados', value: dashboard?.empreendimentos?.length ?? 0 },
        ].map((item) => (
          <article key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{item.label}</div>
            <div className="mt-4 text-4xl font-black tracking-tight text-slate-900">{item.value}</div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Comunicação oficial</div>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Anúncios e atualizações</h2>
            </div>
            <Link href="/agent/service-requests" className="text-sm font-bold text-orange-600">
              Ver minhas demandas
            </Link>
          </div>

          <div className="space-y-4">
            {(dashboard?.announcements ?? []).length > 0 ? (
              dashboard?.announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-orange-700">
                      {announcement.type}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{announcement.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {announcement.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm font-medium text-slate-400">
                Nenhum anúncio recente publicado para a sua rede.
              </div>
            )}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Solicitações recentes</h2>
              <Link href="/agent/service-requests" className="text-sm font-bold text-orange-600">
                Gerenciar
              </Link>
            </div>

            <div className="space-y-3">
              {(dashboard?.serviceRequests ?? []).length > 0 ? (
                dashboard?.serviceRequests.slice(0, 4).map((request) => (
                  <div key={request.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-slate-900">
                        {formatServiceRequestCategory(request.category)}
                      </div>
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-700">
                        {formatServiceRequestStatus(request.status)}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{request.description}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                  Nenhuma solicitação registrada.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Empreendimentos</h2>
              <Link href="/agent/empreendimentos" className="text-sm font-bold text-orange-600">
                Abrir gestão
              </Link>
            </div>

            <div className="space-y-3">
              {(dashboard?.empreendimentos ?? []).length > 0 ? (
                dashboard?.empreendimentos.slice(0, 4).map((empreendimento) => (
                  <div key={empreendimento.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-900">{empreendimento.name}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {empreendimento.type} • {empreendimento.category}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                  Você ainda não possui empreendimentos vinculados.
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
