'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';

export default function AgentStatusPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      void apiFetch('/onboarding/status', { session }).then(setData);
    }
  }, [status]);

  if (status === 'loading') return <div className="p-10 text-center">Carregando sessão...</div>;
  if (status !== 'authenticated') return <div className="p-10 text-center">Faça login para ver o status do onboarding.</div>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Status do onboarding</h1>
        {data ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-bold uppercase text-slate-400">Status</span><div className="font-bold text-slate-900">{data.status}</div></div>
            {data.interviewDate && <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-bold uppercase text-slate-400">Entrevista</span><div className="font-bold text-slate-900">{new Date(data.interviewDate).toLocaleString('pt-BR')}</div></div>}
            {data.feedback && <div className="rounded-2xl bg-orange-50 p-4"><span className="text-xs font-bold uppercase text-orange-500">Feedback</span><p className="text-slate-700 whitespace-pre-wrap">{data.feedback}</p></div>}
          </div>
        ) : (
          <p className="text-slate-400">Carregando status...</p>
        )}
      </div>
    </div>
  );
}
