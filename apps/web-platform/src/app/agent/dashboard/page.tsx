'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';

type DashboardData = {
  connections: number;
  following: number;
  announcements: { id: string; title: string; content: string; type: string; createdAt: string }[];
  serviceRequests: { id: string; category: string; status: string; description: string; createdAt: string }[];
  empreendimentos: { id: string; name: string; category: string; type: string }[];
};

export default function AgentDashboard() {
  const { data: session, status } = useSession();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [agent, setAgent] = useState<{ name: string; vocationType: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    void loadDashboard();
  }, [status]);

  const loadDashboard = async () => {
    try {
      const [agentProfile, dashboardData] = await Promise.all([
        apiFetch('/agents/me', { session }),
        apiFetch('/agents/me/dashboard', { session }),
      ]);

      setAgent(agentProfile);
      setDashboard(dashboardData);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  if (status === 'loading') {
    return <div className="p-10 text-center">Carregando sessão...</div>;
  }

  if (status !== 'authenticated') {
    return <div className="p-10 text-center">Faça login para acessar o dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex gap-6 text-sm font-bold uppercase tracking-wider text-slate-500">
            <Link href="/agent/dashboard" className="text-primary">Início</Link>
            <Link href="/agent/profile">Perfil</Link>
            <Link href="/agent/status">Onboarding</Link>
            <Link href="/agent/empreendimentos">Iniciativas</Link>
            <Link href="/agent/service-requests">Solicitações</Link>
          </div>
          <div className="rounded-xl bg-orange-100 px-3 py-2 text-sm font-bold text-primary">
            {agent?.status ?? 'Sem status'}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-3">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="h-20 bg-gradient-to-r from-primary to-orange-400"></div>
              <div className="-mt-10 px-6 pb-6">
                <div className="mb-4 h-20 w-20 rounded-2xl bg-white p-1 shadow-lg">
                  <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-50 bg-slate-100 text-3xl font-black text-primary">
                    {(agent?.name ?? 'A').charAt(0)}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{agent?.name ?? 'Agente'}</h3>
                <p className="mb-4 text-sm font-medium text-slate-500">{agent?.vocationType ?? 'Atualize seu perfil'}</p>
                <div className="flex justify-between border-t border-slate-100 pt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Conexões</span>
                  <span className="text-primary">{dashboard?.connections ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-900">Ações rápidas</h4>
              <div className="space-y-3 text-sm font-bold">
                <Link href="/onboarding" className="block rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                  Atualizar onboarding
                </Link>
                <Link href="/agent/empreendimentos/create" className="block rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                  Nova iniciativa
                </Link>
                <Link href="/agent/service-requests" className="block rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                  Solicitar apoio
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">Atualizações oficiais</h2>
              <div className="space-y-5">
                {dashboard?.announcements?.length ? dashboard.announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-primary">{announcement.type}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-slate-900">{announcement.title}</h3>
                    <p className="whitespace-pre-wrap text-slate-600">{announcement.content}</p>
                  </div>
                )) : (
                  <p className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                    Nenhuma atualização oficial no momento.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-900">Indicadores</h4>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Seguindo iniciativas</span>
                  <span className="font-bold text-primary">{dashboard?.following ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Solicitações abertas</span>
                  <span className="font-bold text-primary">{dashboard?.serviceRequests?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Empreendimentos</span>
                  <span className="font-bold text-primary">{dashboard?.empreendimentos?.length ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-slate-900 p-8 text-white">
              <h4 className="mb-4 text-xl font-bold">Últimas solicitações</h4>
              <div className="space-y-4 text-sm">
                {dashboard?.serviceRequests?.length ? dashboard.serviceRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl bg-white/5 p-4">
                    <div className="mb-1 font-bold">{request.category}</div>
                    <div className="mb-2 text-slate-400">{request.status}</div>
                    <p className="line-clamp-3 text-slate-300">{request.description}</p>
                  </div>
                )) : (
                  <p className="text-slate-400">Nenhuma solicitação registrada.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
