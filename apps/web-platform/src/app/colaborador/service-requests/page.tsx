'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';

export default function CollaboratorServiceRequestsPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<any[]>([]);

  const loadRequests = async () => {
    const data = await apiFetch('/platform/service-requests', { session });
    setRequests(data);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      void loadRequests();
    }
  }, [status]);

  const updateStatus = async (id: string, statusValue: string) => {
    await apiFetch(`/platform/service-requests/${id}/status`, {
      method: 'PATCH',
      session,
      body: JSON.stringify({ status: statusValue }),
    });
    await loadRequests();
  };

  if (status === 'loading') return <div className="p-10 text-center">Carregando sessão...</div>;
  if (status !== 'authenticated') return <div className="p-10 text-center">Faça login para tratar solicitações.</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Solicitações de apoio</h1>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl bg-slate-50 p-6">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{request.agent.name}</div>
                  <div className="text-sm text-slate-400">{request.category}</div>
                </div>
                <select className="rounded-lg border border-slate-200 bg-white px-3 py-2" value={request.status} onChange={(event) => void updateStatus(request.id, event.target.value)}>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap">{request.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
