'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2, Save } from 'lucide-react';

import { apiFetch } from '../../../../../lib/api';
import { type AppSession } from '../../../../../lib/auth';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Select } from '../../../../../components/ui/select';
import { Separator } from '../../../../../components/ui/separator';
import { Textarea } from '../../../../../components/ui/textarea';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'STUDIES', label: 'Estudos' },
  { value: 'VOLUNTEERING', label: 'Voluntariado' },
  { value: 'EMPLOYMENT', label: 'Emprego' },
  { value: 'MISSION', label: 'Missão' },
  { value: 'ROLE', label: 'Função' },
  { value: 'TRAVEL', label: 'Viagem' },
  { value: 'OTHER', label: 'Outro' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditOpportunityPage() {
  const { data: session } = useSession();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    location: '',
    isRemote: false,
    isPublished: true,
  });

  useEffect(() => {
    if (!session || !params.id) return;
    setIsLoading(true);
    apiFetch(`/opportunities/${params.id}`, { session: session as AppSession })
      .then((data) => {
        setForm({
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location ?? '',
          isRemote: data.isRemote,
          isPublished: data.isPublished,
        });
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [session, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiFetch(`/opportunities/${params.id}`, {
        method: 'PATCH',
        session: session as AppSession,
        body: {
          ...form,
          location: form.location || undefined,
        },
      });
      router.push(`/colaborador/opportunities/${params.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Gestão
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Editar oportunidade
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 shrink-0 self-start"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados da oportunidade</CardTitle>
          <CardDescription>Atualize os campos necessários e salve.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Título *</label>
                <Input
                  required
                  placeholder="Ex: Voluntário para projeto de evangelização"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Categoria *</label>
                <Select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Descrição *</label>
              <Textarea
                required
                rows={7}
                placeholder="Descreva a oportunidade em detalhes…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Local</label>
                <Input
                  placeholder="Cidade / País"
                  value={form.location}
                  disabled={form.isRemote}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Modalidade</label>
                <Select
                  value={form.isRemote ? 'remote' : 'presential'}
                  onChange={(e) => {
                    const remote = e.target.value === 'remote';
                    setForm((f) => ({ ...f, isRemote: remote, location: remote ? '' : f.location }));
                  }}
                >
                  <option value="presential">Presencial</option>
                  <option value="remote">Remota</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status de publicação</label>
                <Select
                  value={form.isPublished ? 'published' : 'draft'}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isPublished: e.target.value === 'published' }))
                  }
                >
                  <option value="published">Publicada</option>
                  <option value="draft">Rascunho</option>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
