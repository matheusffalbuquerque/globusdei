'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';

const CATEGORIES = ['TECHNICAL', 'PSYCHOLOGICAL', 'MEDICAL', 'SPIRITUAL', 'MENTORSHIP', 'LEGAL'] as const;

export default function AgentServiceRequestsPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({ category: 'TECHNICAL', description: '' });
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const data = await apiFetch('/platform/service-requests/mine', { session });
      setRequests(data);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      void loadRequests();
    }
  }, [status]);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch('/platform/service-requests', {
        method: 'POST',
        session,
        body: JSON.stringify(form),
      });
      setForm({ category: 'TECHNICAL', description: '' });
      await loadRequests();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  if (status === 'loading') return <div className="p-10 text-center">Carregando sessão...</div>;
  if (status !== 'authenticated') return <div className="p-10 text-center">Faça login para abrir solicitações.</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <form onSubmit={submitRequest} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Nova solicitação de apoio</h1>
          {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>}
          <select className="w-full rounded-xl border border-slate-200 p-4" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <textarea className="w-full rounded-xl border border-slate-200 p-4" rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descreva o apoio necessário" />
          <button className="rounded-2xl bg-primary px-6 py-3 font-bold text-white">Registrar solicitação</button>
        </form>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Histórico</h2>
          <div className="space-y-4">
            {requests.length ? requests.map((request) => (
              <div key={request.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{request.category}</span>
                  <span className="text-xs font-bold uppercase text-primary">{request.status}</span>
                </div>
                <p className="mt-2 text-slate-600 whitespace-pre-wrap">{request.description}</p>
              </div>
            )) : <p className="text-slate-400">Nenhuma solicitação registrada.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
