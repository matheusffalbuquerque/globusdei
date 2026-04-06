'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { useAgentPortal } from '../../../components/portal/AgentPortalShell';
import { apiFetch } from '../../../lib/api';
import { formatAgentStatus, type AppSession } from '../../../lib/auth';

type ProfileForm = {
  phone: string;
  vocationType: string;
  description: string;
  publicBio: string;
  city: string;
  country: string;
  isActive: boolean;
};

/**
 * AgentProfilePage lets the authenticated agent keep profile and public presentation up to date.
 */
export default function AgentProfilePage() {
  const { data: session } = useSession();
  const { agent, reloadAgent } = useAgentPortal();
  const [form, setForm] = useState<ProfileForm>({
    phone: '',
    vocationType: '',
    description: '',
    publicBio: '',
    city: '',
    country: '',
    isActive: true,
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    void apiFetch('/agents/me', { session: session as AppSession })
      .then((profile) =>
        setForm({
          phone: profile.phone ?? '',
          vocationType: profile.vocationType ?? '',
          description: profile.description ?? '',
          publicBio: profile.publicBio ?? '',
          city: profile.city ?? '',
          country: profile.country ?? '',
          isActive: profile.isActive ?? true,
        }),
      )
      .catch((requestError) => setError((requestError as Error).message));
  }, [session]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setError(null);

    try {
      await apiFetch('/agents/me', {
        method: 'PATCH',
        session: session as AppSession,
        body: JSON.stringify(form),
      });
      await reloadAgent();
      setStatus('saved');
    } catch (requestError) {
      setError((requestError as Error).message);
      setStatus('idle');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Perfil operacional</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Dados do agente</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Atualize sua apresentação, localização e contexto ministerial para melhorar análise, conexão e visibilidade.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Vocação</label>
              <input
                type="text"
                value={form.vocationType}
                onChange={(event) => setForm((current) => ({ ...current, vocationType: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400"
                placeholder="Missionário, mobilizador, intercessor..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Cidade base</label>
              <input
                type="text"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">País</label>
              <input
                type="text"
                value={form.country}
                onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400"
                placeholder="País"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Descrição interna</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:border-orange-400"
              placeholder="Descreva sua atuação, disponibilidade e foco ministerial."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Bio pública</label>
            <textarea
              rows={4}
              value={form.publicBio}
              onChange={(event) => setForm((current) => ({ ...current, publicBio: event.target.value }))}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:border-orange-400"
              placeholder="Resumo enxuto para apresentação pública dentro da plataforma."
            />
          </div>

          <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <div className="font-bold text-slate-900">Perfil ativo</div>
              <div className="text-sm text-slate-500">Permite que sua presença continue ativa na rede.</div>
            </div>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="h-5 w-5 rounded border-slate-300 accent-orange-600"
            />
          </label>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              {status === 'saved' ? 'Perfil salvo com sucesso.' : 'Mantenha esses dados atualizados para facilitar a análise da equipe.'}
            </div>
            <button
              type="submit"
              disabled={status === 'saving'}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {status === 'saving' ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-6">
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Resumo atual</div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">{agent?.name ?? 'Agente'}</h2>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Status</div>
            <div className="mt-2 text-lg font-bold text-slate-900">{formatAgentStatus(agent?.status)}</div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Email</div>
            <div className="mt-2 text-sm font-semibold text-slate-700">{agent?.email ?? 'Sem email'}</div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Vocação</div>
            <div className="mt-2 text-sm font-semibold text-slate-700">{agent?.vocationType || 'Ainda não definida'}</div>
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Próximos passos</div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>1. Garanta que sua descrição reflita sua atuação missionária atual.</p>
            <p>2. Revise a bio pública antes de divulgar sua presença na rede.</p>
            <p>3. Use a tela de onboarding para acompanhar aprovação e entrevista.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
