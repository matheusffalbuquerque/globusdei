'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';
import {
  formatServiceRequestCategory,
  formatServiceRequestStatus,
  type AppSession,
} from '../../../lib/auth';

const CATEGORIES = [
  { value: 'TECHNICAL', label: 'Técnico' },
  { value: 'PSYCHOLOGICAL', label: 'Psicológico' },
  { value: 'MEDICAL', label: 'Médico' },
  { value: 'SPIRITUAL', label: 'Espiritual' },
  { value: 'MENTORSHIP', label: 'Mentoria' },
  { value: 'LEGAL', label: 'Jurídico' },
] as const;

/**
 * AgentServiceRequestsPage manages support requests opened by agents.
 */
export default function AgentServiceRequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({ category: 'TECHNICAL', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await apiFetch('/platform/service-requests/mine', {
        session: session as AppSession,
      });
      setRequests(data);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (session) {
      void loadRequests();
    }
  }, [session]);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiFetch('/platform/service-requests', {
        method: 'POST',
        session: session as AppSession,
        body: JSON.stringify(form),
      });
      setForm({ category: 'TECHNICAL', description: '' });
      await loadRequests();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Novo chamado</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Solicitar apoio da equipe</h1>
        <p className="mt-3 text-slate-600">
          Registre necessidades técnicas, médicas, jurídicas ou de mentoria para acompanhamento do time interno.
        </p>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={submitRequest} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Categoria</label>
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400"
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Descrição da necessidade</label>
            <textarea
              rows={8}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:border-orange-400"
              placeholder="Explique o contexto, urgência e o tipo de ajuda esperado."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Enviando...' : 'Registrar solicitação'}
          </button>
        </form>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Histórico</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Chamados abertos e concluídos</h2>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
            {requests.length} itens
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {requests.length > 0 ? (
            requests.map((request) => (
              <div key={request.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      {formatServiceRequestCategory(request.category)}
                    </div>
                    <div className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-orange-700">
                      {formatServiceRequestStatus(request.status)}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.description}</p>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
              Nenhuma solicitação registrada até o momento.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
