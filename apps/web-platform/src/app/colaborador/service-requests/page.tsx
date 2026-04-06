'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import {
  formatServiceRequestCategory,
  formatServiceRequestStatus,
  type AppSession,
} from '../../../lib/auth';

/**
 * CollaboratorServiceRequestsPage adapts the triage workflow to collaborator permissions.
 */
export default function CollaboratorServiceRequestsPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const [requests, setRequests] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!permissions.canManageRequests) {
      return;
    }

    try {
      const data = await apiFetch('/platform/service-requests', {
        session: session as AppSession,
      });
      setRequests(data);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (session && permissions.canManageRequests) {
      void loadRequests();
    }
  }, [permissions.canManageRequests, session]);

  const updateStatus = async (id: string, statusValue: string) => {
    try {
      await apiFetch(`/platform/service-requests/${id}/status`, {
        method: 'PATCH',
        session: session as AppSession,
        body: JSON.stringify({ status: statusValue, internalNotes: notes[id] || undefined }),
      });
      await loadRequests();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  if (!permissions.canManageRequests) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Acesso restrito</div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Solicitações indisponíveis para seu papel atual</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          O backend exige papéis locais de pessoas ou projetos para triagem deste módulo, então o fluxo foi bloqueado aqui também.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Fila operacional</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Solicitações de apoio</h1>
        <p className="mt-3 text-slate-600">
          Atualize status e registre notas internas para acompanhamento do suporte prestado aos agentes.
        </p>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <article key={request.id} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                    {request.agent.name}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900">
                    {formatServiceRequestCategory(request.category)}
                  </h2>
                  <div className="mt-2 text-sm font-semibold text-slate-500">
                    {formatServiceRequestStatus(request.status)}
                  </div>
                </div>

                <select
                  value={request.status}
                  onChange={(event) => void updateStatus(request.id, event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  <option value="OPEN">Aberta</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="RESOLVED">Resolvida</option>
                  <option value="CLOSED">Encerrada</option>
                </select>
              </div>

              <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.description}</p>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-bold text-slate-700">Notas internas</label>
                <textarea
                  rows={4}
                  value={notes[request.id] ?? request.internalNotes ?? ''}
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [request.id]: event.target.value,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
                  placeholder="Registre andamento, encaminhamentos ou dependências."
                />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            Nenhuma solicitação aberta para triagem.
          </div>
        )}
      </section>
    </div>
  );
}
