'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';

type Empreendimento = {
  id: string;
  name: string;
  type: string;
  category: string;
  priorityScore: number;
  isBankVerified: boolean;
};

type Invite = {
  id: string;
  token: string;
  empreendimento: { name: string };
  role: string;
};

export default function MyEmpreendimentos() {
  const { data: session, status } = useSession();
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    void fetchData();
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empreendimentoData, inviteData] = await Promise.all([
        apiFetch('/empreendimentos/mine', { session }),
        apiFetch('/empreendimentos/invites/my', { session }),
      ]);

      setEmpreendimentos(empreendimentoData);
      setInvites(inviteData);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (token: string) => {
    try {
      await apiFetch(`/empreendimentos/invites/${token}/accept`, {
        method: 'POST',
        session,
      });
      await fetchData();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  if (status === 'loading') {
    return <div className="p-10 text-center">Carregando sessão...</div>;
  }

  if (status !== 'authenticated') {
    return <div className="p-10 text-center">Faça login para gerenciar empreendimentos.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus empreendimentos</h1>
            <p className="mt-2 text-gray-500">Gerencie suas iniciativas e colaborações na Globus Dei.</p>
          </div>
          <button
            onClick={() => router.push('/agent/empreendimentos/create')}
            className="rounded-xl bg-orange-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-orange-700"
          >
            + Nova iniciativa
          </button>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>}

        {invites.length > 0 && (
          <div className="mb-12 rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
            <h2 className="mb-4 flex items-center text-lg font-bold text-blue-900">
              <span className="mr-2">Convites pendentes</span>
            </h2>
            <div className="space-y-4">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-xl border border-blue-200 bg-white p-4"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      Você foi convidado para ser <span className="text-blue-600">{invite.role}</span> no projeto{' '}
                      <span className="text-orange-600">{invite.empreendimento.name}</span>
                    </p>
                    <p className="text-sm text-gray-500">Aceite para começar a colaborar.</p>
                  </div>
                  <button
                    onClick={() => acceptInvite(invite.token)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Aceitar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center text-gray-400">
            Carregando empreendimentos...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {empreendimentos.map((empreendimento) => (
              <div
                key={empreendimento.id}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative h-32 bg-gradient-to-r from-gray-100 to-gray-200">
                  <div className="absolute -bottom-6 left-6 flex h-16 w-16 items-center justify-center rounded-xl border border-gray-50 bg-white text-xl font-bold text-gray-400 shadow-md">
                    {empreendimento.name.charAt(0)}
                  </div>
                  <div className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-gray-600 backdrop-blur-sm">
                    {empreendimento.type}
                  </div>
                </div>
                <div className="p-8 pt-10">
                  <h3 className="mb-1 text-xl font-bold text-gray-900 transition group-hover:text-orange-600">
                    {empreendimento.name}
                  </h3>
                  <p className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
                    {empreendimento.category}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-tighter text-gray-400">Score</span>
                      <span className={`text-lg font-bold ${empreendimento.priorityScore > 70 ? 'text-red-500' : 'text-blue-500'}`}>
                        {empreendimento.priorityScore}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold uppercase tracking-tighter text-gray-400">Banco</span>
                      <span className={empreendimento.isBankVerified ? 'font-bold text-green-600' : 'font-medium text-gray-400'}>
                        {empreendimento.isBankVerified ? 'Verificado' : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/agent/empreendimentos/edit/${empreendimento.id}`)}
                    className="mt-8 w-full rounded-xl bg-gray-900 py-3 font-bold text-white transition hover:bg-black"
                  >
                    Gerenciar projeto
                  </button>
                </div>
              </div>
            ))}

            {empreendimentos.length === 0 && (
              <div className="col-span-full rounded-3xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
                <p className="text-lg text-gray-400">Você ainda não possui iniciativas cadastradas.</p>
                <button
                  onClick={() => router.push('/agent/empreendimentos/create')}
                  className="mt-4 font-bold text-orange-600 hover:underline"
                >
                  Clique aqui para criar a primeira
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
