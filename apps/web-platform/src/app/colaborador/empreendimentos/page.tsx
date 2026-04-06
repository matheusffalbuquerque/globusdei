'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { formatFollowUpStatus, type AppSession } from '../../../lib/auth';

type Empreendimento = {
  id: string;
  name: string;
  type: string;
  category: string;
  location?: string | null;
  priorityScore: number;
  isBankVerified: boolean;
  followUpStatus: string;
  internalNotes?: string | null;
  serviceLogs: { id: string; action: string; content: string; createdAt: string }[];
};

/**
 * CollaboratorEmpreendimentosPage mirrors the internal project triage workflow for project managers.
 */
export default function CollaboratorEmpreendimentosPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [selected, setSelected] = useState<Empreendimento | null>(null);
  const [score, setScore] = useState(0);
  const [followUpStatus, setFollowUpStatus] = useState('OPEN');
  const [notes, setNotes] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmpreendimentos = async () => {
    if (!permissions.canManageProjects) {
      return;
    }

    try {
      const data = await apiFetch('/empreendimentos', { session: session as AppSession });
      setEmpreendimentos(data);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (session && permissions.canManageProjects) {
      void loadEmpreendimentos();
    }
  }, [permissions.canManageProjects, session]);

  const openSelection = (empreendimento: Empreendimento) => {
    setSelected(empreendimento);
    setScore(empreendimento.priorityScore);
    setFollowUpStatus(empreendimento.followUpStatus);
    setNotes(empreendimento.internalNotes || '');
    setBankVerified(empreendimento.isBankVerified);
  };

  const handleUpdateInternal = async () => {
    if (!selected) {
      return;
    }

    try {
      await apiFetch(`/empreendimentos/${selected.id}/internal`, {
        method: 'PATCH',
        session: session as AppSession,
        body: JSON.stringify({
          priorityScore: Number(score),
          isBankVerified: bankVerified,
          followUpStatus,
          internalNotes: notes,
        }),
      });
      setSelected(null);
      await loadEmpreendimentos();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  if (!permissions.canManageProjects) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Acesso restrito</div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Gestão de empreendimentos indisponível</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Este módulo exige papel local de gestão de projetos. A navegação e os formulários foram bloqueados para refletir a policy do backend.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Governança de iniciativas</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Controle interno de empreendimentos</h1>
        <p className="mt-3 text-slate-600">
          Priorize iniciativas, valide dados bancários e registre observações internas de acompanhamento.
        </p>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        {empreendimentos.map((empreendimento) => (
          <article key={empreendimento.id} className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  {empreendimento.type} • {empreendimento.category}
                </div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">{empreendimento.name}</h2>
                <div className="mt-2 text-sm text-slate-500">{empreendimento.location || 'Local não informado'}</div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                Score {empreendimento.priorityScore}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Banco</div>
                <div className="mt-2 font-bold text-slate-900">
                  {empreendimento.isBankVerified ? 'Verificado' : 'Pendente'}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Follow-up</div>
                <div className="mt-2 font-bold text-slate-900">
                  {formatFollowUpStatus(empreendimento.followUpStatus)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openSelection(empreendimento)}
              className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
            >
              Abrir análise
            </button>
          </article>
        ))}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Análise interna</div>
                <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{selected.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600"
              >
                Fechar
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Score de prioridade</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(event) => setScore(Number(event.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="mt-3 text-4xl font-black text-blue-600">{score}</div>
                </div>

                <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <div>
                    <div className="font-bold text-slate-900">Validar dados bancários</div>
                    <div className="text-sm text-slate-500">Libera preenchimento dos dados pelo agente.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bankVerified}
                    onChange={(event) => setBankVerified(event.target.checked)}
                    className="h-5 w-5 accent-green-600"
                  />
                </label>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Status de acompanhamento</label>
                  <select
                    value={followUpStatus}
                    onChange={(event) => setFollowUpStatus(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <option value="OPEN">Triagem</option>
                    <option value="MONITORING">Em acompanhamento</option>
                    <option value="ON_HOLD">Em pausa</option>
                    <option value="CLOSED">Finalizado</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Notas internas</label>
                  <textarea
                    rows={6}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
                    placeholder="Riscos, observações e encaminhamentos."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void handleUpdateInternal()}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
                >
                  Salvar análise
                </button>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Histórico</div>
                <div className="mt-4 space-y-4">
                  {selected.serviceLogs?.length > 0 ? (
                    selected.serviceLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </div>
                        <div className="mt-2 text-sm font-bold text-slate-900">{log.action}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{log.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                      Nenhum histórico interno registrado para este empreendimento.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
