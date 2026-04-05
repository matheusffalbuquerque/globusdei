'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';

type PendingAgent = {
  id: string;
  name: string;
  email: string;
  status: string;
  updatedAt: string;
  interviewLink?: string;
  answers: { question: { title: string }; text: string }[];
};

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  meetLink?: string;
  agent?: { name: string };
};

export default function ColaboradorDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'triagem' | 'agenda'>('triagem');
  const [agents, setAgents] = useState<PendingAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<PendingAgent | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '', meetLink: '' });
  const [summary, setSummary] = useState<{ pendingAgents: number; managedEmpreendimentos: number; openRequests: number; totalAnnouncements: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    void Promise.all([fetchAgents(), fetchSlots(), fetchSummary()]);
  }, [status]);

  const fetchSummary = async () => {
    const data = await apiFetch('/collaborators/me/dashboard', { session });
    setSummary(data);
  };

  const fetchAgents = async () => {
    const data = await apiFetch('/onboarding/pending-analysis', { session });
    setAgents(data);
  };

  const fetchSlots = async () => {
    const data = await apiFetch('/onboarding/collaborator/slots', { session });
    setSlots(data);
  };

  const approveForInterview = async () => {
    if (!selectedAgent) return;
    try {
      await apiFetch(`/onboarding/${selectedAgent.id}/approve`, {
        method: 'POST',
        session,
      });
      setSelectedAgent(null);
      await fetchAgents();
      await fetchSummary();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const createSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch('/onboarding/collaborator/slots', {
        method: 'POST',
        session,
        body: JSON.stringify(newSlot),
      });
      setNewSlot({ startTime: '', endTime: '', meetLink: '' });
      await fetchSlots();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const deleteSlot = async (id: string) => {
    try {
      await apiFetch(`/onboarding/collaborator/slots/${id}`, {
        method: 'DELETE',
        session,
      });
      await fetchSlots();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  if (status === 'loading') {
    return <div className="p-10 text-center">Carregando sessão...</div>;
  }

  if (status !== 'authenticated') {
    return <div className="p-10 text-center">Faça login para acessar o painel do colaborador.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent">
            Globus Dei
          </span>
        </div>
        <nav className="flex-1 space-y-2 px-4 py-6">
          <button
            onClick={() => setActiveTab('triagem')}
            className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
              activeTab === 'triagem' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Análises pendentes
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
              activeTab === 'agenda' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Minha agenda
          </button>
          <a href="/colaborador/empreendimentos" className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Empreendimentos
          </a>
          <a href="/colaborador/service-requests" className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Solicitações
          </a>
          <a href="/colaborador/announcements" className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Conteúdo
          </a>
          <a href="/colaborador/finance" className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Financeiro
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'triagem' ? 'Painel do colaborador - triagem' : 'Gestão de disponibilidade'}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {summary
                ? `${summary.pendingAgents} agentes pendentes, ${summary.openRequests} solicitações abertas`
                : 'Resumo operacional do colaborador'}
            </p>
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>}

        {activeTab === 'triagem' ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Agente</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Atualização</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {agents.map((agent) => (
                  <tr key={agent.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 font-bold text-white">
                          {agent.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          <div className="text-sm text-gray-500">{agent.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 bg-yellow-100 text-yellow-800">
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(agent.updatedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedAgent(agent)}
                        className="rounded-lg bg-indigo-50 px-4 py-2 font-semibold text-indigo-600 hover:text-indigo-900"
                      >
                        {agent.status === 'SUBMITTED' ? 'Analisar questionário' : 'Ver detalhes'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {agents.length === 0 && <div className="p-8 text-center text-gray-500">Nenhum agente pendente de análise.</div>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold">Adicionar horário</h3>
                <form onSubmit={createSlot} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Início</label>
                    <input
                      type="datetime-local"
                      required
                      className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newSlot.startTime}
                      onChange={(event) => setNewSlot({ ...newSlot, startTime: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Término</label>
                    <input
                      type="datetime-local"
                      required
                      className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newSlot.endTime}
                      onChange={(event) => setNewSlot({ ...newSlot, endTime: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Link do Meet</label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newSlot.meetLink}
                      onChange={(event) => setNewSlot({ ...newSlot, meetLink: event.target.value })}
                    />
                  </div>
                  <button type="submit" className="w-full rounded-lg bg-blue-600 py-2 font-bold text-white transition-colors hover:bg-blue-700">
                    Salvar horário
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500">Horário</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-medium uppercase text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {slots.map((slot) => (
                      <tr key={slot.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(slot.startTime).toLocaleString('pt-BR')} - {new Date(slot.endTime).toLocaleTimeString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          {slot.agent ? (
                            <span className="font-medium text-green-600">Reservado por {slot.agent.name}</span>
                          ) : (
                            <span className="italic text-gray-400">Disponível</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!slot.agent && (
                            <button onClick={() => deleteSlot(slot.id)} className="text-sm font-bold text-red-600 hover:text-red-900">
                              Remover
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[40px] bg-white p-12 shadow-2xl">
            <div className="mb-10 flex items-start justify-between">
              <div>
                <h2 className="text-4xl font-bold text-gray-900">Análise do onboarding</h2>
                <p className="mt-2 text-gray-400">
                  Agente: <span className="font-bold">{selectedAgent.name}</span>
                </p>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                ×
              </button>
            </div>

            <div className="space-y-8">
              {selectedAgent.answers.map((answer, index) => (
                <div key={`${selectedAgent.id}-${index}`} className="rounded-3xl border border-gray-100 bg-gray-50 p-8">
                  <h3 className="mb-3 text-lg font-bold text-gray-900">{answer.question.title}</h3>
                  <p className="whitespace-pre-wrap text-gray-600">{answer.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-end gap-4">
              <button onClick={() => setSelectedAgent(null)} className="rounded-2xl bg-gray-100 px-8 py-4 font-bold text-gray-700">
                Fechar
              </button>
              {selectedAgent.status === 'SUBMITTED' && (
                <button
                  onClick={() => void approveForInterview()}
                  className="rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white transition hover:bg-blue-700"
                >
                  Aprovar para entrevista
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
