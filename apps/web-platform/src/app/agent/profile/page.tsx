'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';

export default function AgentProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      void apiFetch('/agents/me', { session })
        .then(setProfile)
        .catch((requestError) => setError((requestError as Error).message));
    }
  }, [status]);

  if (status === 'loading') return <div className="p-10 text-center">Carregando sessão...</div>;
  if (status !== 'authenticated') return <div className="p-10 text-center">Faça login para acessar seu perfil.</div>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Perfil do agente</h1>
        {profile ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div><span className="block text-xs font-bold uppercase text-slate-400">Nome</span><span className="font-bold text-slate-900">{profile.name}</span></div>
            <div><span className="block text-xs font-bold uppercase text-slate-400">E-mail</span><span className="font-bold text-slate-900">{profile.email}</span></div>
            <div><span className="block text-xs font-bold uppercase text-slate-400">Vocação</span><span className="font-bold text-slate-900">{profile.vocationType}</span></div>
            <div><span className="block text-xs font-bold uppercase text-slate-400">Status</span><span className="font-bold text-slate-900">{profile.status}</span></div>
            <div className="md:col-span-2"><span className="block text-xs font-bold uppercase text-slate-400">Descrição</span><p className="text-slate-600 whitespace-pre-wrap">{profile.description}</p></div>
          </div>
        ) : (
          <p className="text-slate-400">Carregando perfil...</p>
        )}
      </div>
    </div>
  );
}
