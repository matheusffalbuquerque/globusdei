'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Loader2, Save, UserCircle } from 'lucide-react';

import { useAgentPortal } from '../../../components/portal/AgentPortalShell';
import { apiFetch } from '../../../lib/api';
import { formatAgentStatus, type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { Textarea } from '../../../components/ui/textarea';

type ProfileForm = {
  phone: string;
  vocationType: string;
  description: string;
  publicBio: string;
  city: string;
  country: string;
  isActive: boolean;
};

function agentStatusVariant(s?: string) {
  if (!s) return 'secondary' as const;
  if (s === 'APPROVED') return 'success' as const;
  if (s === 'REJECTED') return 'destructive' as const;
  if (s === 'QUALIFIED' || s === 'SCHEDULED') return 'info' as const;
  if (s === 'SUBMITTED') return 'warning' as const;
  return 'secondary' as const;
}

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
      {/* Form panel */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Perfil operacional
          </p>
          <CardTitle className="mt-0.5 text-base">Dados do agente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Atualize sua apresentação, localização e contexto ministerial para melhorar análise, conexão e visibilidade.
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Telefone</label>
                <Input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Vocação</label>
                <Input
                  type="text"
                  value={form.vocationType}
                  onChange={(e) => setForm((c) => ({ ...c, vocationType: e.target.value }))}
                  placeholder="Missionário, mobilizador, intercessor…"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Cidade base</label>
                <Input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">País</label>
                <Input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm((c) => ({ ...c, country: e.target.value }))}
                  placeholder="País"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Descrição interna</label>
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                placeholder="Descreva sua atuação, disponibilidade e foco ministerial."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Bio pública</label>
              <Textarea
                rows={4}
                value={form.publicBio}
                onChange={(e) => setForm((c) => ({ ...c, publicBio: e.target.value }))}
                placeholder="Resumo enxuto para apresentação pública dentro da plataforma."
              />
            </div>

            {/* Toggle ativo */}
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Perfil ativo</p>
                <p className="text-xs text-muted-foreground">
                  Permite que sua presença continue ativa na rede.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary"
              />
            </label>

            <div className="flex items-center justify-between gap-4 pt-1">
              {status === 'saved' ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Perfil salvo com sucesso.
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Mantenha esses dados atualizados para facilitar a análise da equipe.
                </span>
              )}
              <Button type="submit" disabled={status === 'saving'}>
                {status === 'saving' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {status === 'saving' ? 'Salvando…' : 'Salvar perfil'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Summary sidebar */}
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{agent?.name ?? 'Agente'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant={agentStatusVariant(agent?.status)}>
                  {formatAgentStatus(agent?.status)}
                </Badge>
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {agent?.email ?? 'Sem email'}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Vocação
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {agent?.vocationType || 'Ainda não definida'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Próximos passos
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Garanta que sua descrição reflita sua atuação missionária atual.</p>
            <p>2. Revise a bio pública antes de divulgar sua presença na rede.</p>
            <p>3. Use a tela de onboarding para acompanhar aprovação e entrevista.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
