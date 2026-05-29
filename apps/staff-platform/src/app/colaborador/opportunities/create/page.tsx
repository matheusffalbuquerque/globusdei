'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Send } from 'lucide-react';

import { useCollaboratorPortal } from '../../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../../lib/api';
import { type AppSession } from '../../../../lib/auth';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Separator } from '../../../../components/ui/separator';
import { Textarea } from '../../../../components/ui/textarea';

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

export default function CreateOpportunityPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    location: '',
    isRemote: false,
  });

  // Apenas ADMIN e PROJECT_MANAGER podem criar
  if (!permissions.canManageContent && !permissions.canManageProjects) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
        Você não tem permissão para criar oportunidades.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const created = await apiFetch('/opportunities/collaborator', {
        method: 'POST',
        session: session as AppSession,
        body: {
          ...form,
          location: form.location || undefined,
        },
      });
      router.push(`/colaborador/opportunities/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Gestão · Nova publicação
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Criar oportunidade
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados abaixo. Apenas título e descrição são obrigatórios.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 shrink-0 self-start"
        >
          <ArrowLeft className="h-4 w-4" /> Oportunidades
        </Button>
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Formulário ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados da oportunidade</CardTitle>
          <CardDescription>
            A oportunidade ficará visível a todos os agentes logo após a criação.
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Título + Categoria lado a lado */}
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
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Descrição *</label>
              <Textarea
                required
                rows={7}
                placeholder="Descreva a oportunidade, requisitos, contexto e como entrar em contato…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Local e modalidade */}
            <div className="grid gap-4 sm:grid-cols-2">
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
                    setForm((f) => ({
                      ...f,
                      isRemote: remote,
                      location: remote ? '' : f.location,
                    }));
                  }}
                >
                  <option value="presential">Presencial</option>
                  <option value="remote">Remota</option>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Ações */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                <Send className="h-4 w-4" />
                {isSaving ? 'Publicando…' : 'Publicar oportunidade'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
