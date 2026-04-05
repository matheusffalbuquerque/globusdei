'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';

export default function CollaboratorAnnouncementsPage() {
  const { data: session, status } = useSession();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', content: '', type: 'SYSTEM' });
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    try {
      const data = await apiFetch('/announcements/all', { session });
      setAnnouncements(data);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      void loadAnnouncements();
    }
  }, [status]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch('/announcements', {
        method: 'POST',
        session,
        body: JSON.stringify(form),
      });
      setForm({ title: '', content: '', type: 'SYSTEM' });
      await loadAnnouncements();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  if (status === 'loading') return <div className="p-10 text-center">Carregando sessão...</div>;
  if (status !== 'authenticated') return <div className="p-10 text-center">Faça login para gerenciar conteúdo.</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Novo anúncio</h1>
        {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>}
        <input className="w-full rounded-xl border border-slate-200 p-4" placeholder="Título" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <select className="w-full rounded-xl border border-slate-200 p-4" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
          <option value="SYSTEM">SYSTEM</option>
          <option value="MISSION">MISSION</option>
          <option value="OPPORTUNITY">OPPORTUNITY</option>
          <option value="EVENT">EVENT</option>
        </select>
        <textarea className="w-full rounded-xl border border-slate-200 p-4" rows={8} placeholder="Conteúdo" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
        <button className="rounded-2xl bg-primary px-6 py-3 font-bold text-white">Publicar</button>
      </form>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Feed oficial</h2>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-primary">{announcement.type}</span>
                <span className="text-xs text-slate-400">{new Date(announcement.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="font-bold text-slate-900">{announcement.title}</div>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">{announcement.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
