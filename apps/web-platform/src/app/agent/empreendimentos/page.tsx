'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';
import { formatFollowUpStatus, type AppSession } from '../../../lib/auth';

type Empreendimento = {
  id: string;
  name: string;
  type: string;
  category: string;
  priorityScore: number;
  isBankVerified: boolean;
  followUpStatus?: string;
};

type Invite = {
  id: string;
  token: string;
  empreendimento: { name: string };
  role: string;
};

/**
 * AgentEmpreendimentosPage organizes active initiatives and pending invitations for the agent.
 */
export default function AgentEmpreendimentosPage() {
  const { data: session } = useSession();
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empreendimentoData, inviteData] = await Promise.all([
        apiFetch('/empreendimentos/mine', { session: session as AppSession }),
        apiFetch('/empreendimentos/invites/my', { session: session as AppSession }),
      ]);

      setEmpreendimentos(empreendimentoData);
      setInvites(inviteData);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      void loadData();
    }
  }, [session]);

  const acceptInvite = async (token: string) => {
    try {
      await apiFetch(`/empreendimentos/invites/${token}/accept`, {
        method: 'POST',
        session: session as AppSession,
      });
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Gestão das iniciativas</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Empreendimentos e convites</h1>
            <p className="mt-3 text-slate-600">
              Administre os projetos que você lidera, acompanhe validação bancária e aceite convites de colaboração.
            </p>
          </div>
          <Link
            href="/agent/empreendimentos/create"
            className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white"
          >
            Nova iniciativa
          </Link>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {invites.length > 0 && (
        <section className="rounded-[32px] border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-blue-500">Convites pendentes</div>
          <div className="space-y-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    Convite para atuar como {invite.role} em {invite.empreendimento.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Aceite o convite para vincular esta iniciativa ao seu painel.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void acceptInvite(invite.token)}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"
                >
                  Aceitar convite
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            Carregando empreendimentos...
          </div>
        ) : empreendimentos.length > 0 ? (
          empreendimentos.map((empreendimento) => (
            <article key={empreendimento.id} className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    {empreendimento.type} • {empreendimento.category}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900">{empreendimento.name}</h2>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600">
                  Score {empreendimento.priorityScore}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Banco</div>
                  <div className="mt-2 font-bold text-slate-900">
                    {empreendimento.isBankVerified ? 'Verificado' : 'Aguardando validação'}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Acompanhamento</div>
                  <div className="mt-2 font-bold text-slate-900">
                    {formatFollowUpStatus(empreendimento.followUpStatus)}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link
                  href={`/agent/empreendimentos/${empreendimento.id}`}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700"
                >
                  Ver detalhes
                </Link>
                <Link
                  href={`/agent/empreendimentos/edit/${empreendimento.id}`}
                  className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Gerenciar
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="text-lg font-bold text-slate-900">Nenhuma iniciativa cadastrada ainda.</div>
            <p className="mt-2 text-sm text-slate-500">Crie seu primeiro empreendimento para começar a operar na plataforma.</p>
            <Link
              href="/agent/empreendimentos/create"
              className="mt-6 inline-flex rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white"
            >
              Criar primeira iniciativa
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
