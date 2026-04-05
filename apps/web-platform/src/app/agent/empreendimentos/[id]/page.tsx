'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../../lib/api';

export default function EmpreendimentoDetailPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [empreendimento, setEmpreendimento] = useState<any>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      void apiFetch(`/empreendimentos/${id}`, { session }).then(setEmpreendimento);
    }
  }, [id, status]);

  if (status === 'loading') return <div className="p-10 text-center">Carregando sessão...</div>;
  if (status !== 'authenticated') return <div className="p-10 text-center">Faça login para ver a iniciativa.</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {empreendimento ? (
          <>
            <h1 className="mb-2 text-3xl font-bold text-slate-900">{empreendimento.name}</h1>
            <p className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-400">{empreendimento.type} • {empreendimento.category}</p>
            <p className="mb-8 whitespace-pre-wrap text-slate-600">{empreendimento.description}</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-bold uppercase text-slate-400">Localização</span><div className="font-bold text-slate-900">{empreendimento.location ?? 'Não informado'}</div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-bold uppercase text-slate-400">Banco</span><div className="font-bold text-slate-900">{empreendimento.isBankVerified ? 'Verificado' : 'Pendente'}</div></div>
            </div>
          </>
        ) : (
          <p className="text-slate-400">Carregando empreendimento...</p>
        )}
      </div>
    </div>
  );
}
