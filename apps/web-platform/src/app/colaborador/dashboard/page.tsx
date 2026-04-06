'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import {
  formatAgentStatus,
  formatCollaboratorRole,
  type AppSession,
} from '../../../lib/auth';

type PendingAgent = {
  id: string;
  name: string;
  email: string;
  status: string;
  updatedAt: string;
  answers: { question: { title: string }; text: string }[];
};

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  meetLink?: string | null;
  agent?: { name: string };
};

type DashboardSummary = {
  pendingAgents: number;
  managedEmpreendimentos: number;
  openRequests: number;
  totalAnnouncements: number;
};

/**
 * CollaboratorDashboard adapts the operational cockpit to the collaborator local permissions.
 */
export default function CollaboratorDashboard() {
  const { data: session } = useSession();
  const { collaborator, permissions } = useCollaboratorPortal();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [agents, setAgents] = useState<PendingAgent[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<PendingAgent | null>(null);
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '', meetLink: '' });
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    try {
      const data = await apiFetch('/collaborators/me/dashboard', {
        session: session as AppSession,
      });
      setSummary(data);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const loadOnboardingQueue = async () => {
    if (!permissions.canManageOnboarding) {
      return;
    }

    try {
      const [agentData, slotData] = await Promise.all([
        apiFetch('/onboarding/pending-analysis', { session: session as AppSession }),
        apiFetch('/onboarding/collaborator/slots', { session: session as AppSession }),
      ]);
      setAgents(agentData);
      setSlots(slotData);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (!session) {
      return;
    }

    void loadSummary();
    void loadOnboardingQueue();
  }, [permissions.canManageOnboarding, session]);

  const approveForInterview = async () => {
    if (!selectedAgent) {
      return;
    }

    try {
      await apiFetch(`/onboarding/${selectedAgent.id}/approve`, {
        method: 'POST',
        session: session as AppSession,
      });
      setSelectedAgent(null);
      await Promise.all([loadSummary(), loadOnboardingQueue()]);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const createSlot = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await apiFetch('/onboarding/collaborator/slots', {
        method: 'POST',
        session: session as AppSession,
        body: JSON.stringify(newSlot),
      });
      setNewSlot({ startTime: '', endTime: '', meetLink: '' });
      await loadOnboardingQueue();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      await apiFetch(`/onboarding/collaborator/slots/${slotId}`, {
        method: 'DELETE',
        session: session as AppSession,
      });
      await loadOnboardingQueue();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Resumo operacional</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {collaborator?.name ? `Bem-vindo, ${collaborator.name.split(' ')[0]}` : 'Painel do colaborador'}
            </h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Este painel adapta módulos e fluxos à sua atuação local. Recursos de escrita só aparecem quando o backend permite.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(collaborator?.roles ?? []).map((role) => (
              <span
                key={role}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white"
              >
                {formatCollaboratorRole(role)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Agentes pendentes', value: summary?.pendingAgents ?? 0 },
          { label: 'Empreendimentos sob gestão', value: summary?.managedEmpreendimentos ?? 0 },
          { label: 'Solicitações abertas', value: summary?.openRequests ?? 0 },
          { label: 'Anúncios ativos', value: summary?.totalAnnouncements ?? 0 },
        ].map((item) => (
          <article key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{item.label}</div>
            <div className="mt-4 text-4xl font-black tracking-tight text-slate-900">{item.value}</div>
          </article>
        ))}
      </section>

      {permissions.canManageOnboarding ? (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Pessoas</div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Fila de análise do onboarding</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                {agents.length} em análise
              </div>
            </div>

            <div className="space-y-4">
              {agents.length > 0 ? (
                agents.map((agent) => (
                  <div key={agent.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-lg font-bold text-slate-900">{agent.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{agent.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-amber-800">
                          {formatAgentStatus(agent.status)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedAgent(agent)}
                          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                        >
                          Revisar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                  Nenhum agente aguardando triagem agora.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Agenda de entrevistas</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Disponibilidade do time</h2>

            <form onSubmit={createSlot} className="mt-6 space-y-4 rounded-3xl bg-slate-50 p-5">
              <input
                type="datetime-local"
                required
                value={newSlot.startTime}
                onChange={(event) => setNewSlot((current) => ({ ...current, startTime: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
              />
              <input
                type="datetime-local"
                required
                value={newSlot.endTime}
                onChange={(event) => setNewSlot((current) => ({ ...current, endTime: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
              />
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={newSlot.meetLink}
                onChange={(event) => setNewSlot((current) => ({ ...current, meetLink: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
              />
              <button type="submit" className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">
                Publicar horário
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {slots.length > 0 ? (
                slots.map((slot) => (
                  <div key={slot.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-900">
                      {new Date(slot.startTime).toLocaleString('pt-BR')}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {slot.agent?.name ? `Reservado por ${slot.agent.name}` : 'Disponível'}
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteSlot(slot.id)}
                      className="mt-3 text-sm font-bold text-red-600"
                    >
                      Remover horário
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                  Nenhum horário publicado ainda.
                </div>
              )}
            </div>
          </article>
        </section>
      ) : (
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Permissões locais</div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Seu painel está em modo resumido</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Você não possui papel local para triagem de onboarding. Os módulos visíveis no menu lateral refletem suas permissões atuais.
          </p>
        </section>
      )}

      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Análise do agente</div>
                <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{selectedAgent.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{selectedAgent.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600"
              >
                Fechar
              </button>
            </div>

            <div className="mt-8 space-y-4">
              {selectedAgent.answers.map((answer, index) => (
                <div key={`${answer.question.title}-${index}`} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <div className="text-sm font-bold text-slate-900">{answer.question.title}</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{answer.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => void approveForInterview()}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
              >
                Aprovar para entrevista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
