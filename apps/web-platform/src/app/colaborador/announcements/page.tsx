'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';

/**
 * CollaboratorAnnouncementsPage exposes a read-only or editable content workflow based on local roles.
 */
export default function CollaboratorAnnouncementsPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', content: '', type: 'SYSTEM' });
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    try {
      const data = await apiFetch('/announcements/all', { session: session as AppSession });
      setAnnouncements(data);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (session) {
      void loadAnnouncements();
    }
  }, [session]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await apiFetch('/announcements', {
        method: 'POST',
        session: session as AppSession,
        body: JSON.stringify(form),
      });
      setForm({ title: '', content: '', type: 'SYSTEM' });
      await loadAnnouncements();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Comunicação oficial</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Feed da plataforma</h1>
        <p className="mt-3 text-slate-600">
          O feed é visível para todo colaborador. A publicação só é habilitada para papéis locais com gestão de conteúdo.
        </p>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {permissions.canManageContent ? (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              placeholder="Título do anúncio"
            />
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <option value="SYSTEM">SYSTEM</option>
              <option value="MISSION">MISSION</option>
              <option value="OPPORTUNITY">OPPORTUNITY</option>
              <option value="EVENT">EVENT</option>
            </select>
            <textarea
              rows={8}
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
              placeholder="Mensagem oficial para agentes e colaboradores."
            />
            <button type="submit" className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white">
              Publicar anúncio
            </button>
          </form>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Seu papel atual permite leitura do feed, mas não publicação de novos anúncios.
          </div>
        )}
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Histórico</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Anúncios publicados</h2>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
            {announcements.length} registros
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-orange-700">
                    {announcement.type}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{announcement.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.content}</p>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
              Nenhum anúncio publicado até o momento.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
