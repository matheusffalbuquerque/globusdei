'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BadgeCheck, Building2, CheckCircle2, Plus } from 'lucide-react';

import { apiFetch } from '../../../lib/api';
import { formatFollowUpStatus, type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

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
      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Gestão das iniciativas
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Empreendimentos e convites
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Administre os projetos que você lidera, acompanhe validação bancária e aceite convites de colaboração.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/agent/empreendimentos/create">
              <Plus className="mr-1.5 h-4 w-4" />
              Nova iniciativa
            </Link>
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Convites pendentes
            </p>
            <CardTitle className="text-base text-foreground">
              Você tem {invites.length} convite{invites.length > 1 ? 's' : ''} aguardando resposta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Convite para atuar como{' '}
                    <span className="font-semibold">{invite.role}</span> em{' '}
                    <span className="font-semibold">{invite.empreendimento.name}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Aceite o convite para vincular esta iniciativa ao seu painel.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => void acceptInvite(invite.token)}
                  className="shrink-0"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Aceitar convite
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empreendimentos grid */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 space-y-3">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="h-14 rounded-lg bg-muted" />
                  <div className="h-14 rounded-lg bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : empreendimentos.length > 0 ? (
          empreendimentos.map((empreendimento) => (
            <Card key={empreendimento.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {empreendimento.type} · {empreendimento.category}
                    </p>
                    <CardTitle className="mt-1 text-base leading-snug">
                      {empreendimento.name}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-bold">
                    Score {empreendimento.priorityScore}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Banco
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {empreendimento.isBankVerified ? (
                        <>
                          <BadgeCheck className="h-3.5 w-3.5 text-green-600" />
                          <Badge variant="success" className="text-[10px]">Verificado</Badge>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Aguardando</Badge>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Acompanhamento
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-foreground">
                      {formatFollowUpStatus(empreendimento.followUpStatus)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/agent/empreendimentos/${empreendimento.id}`}>
                      <Building2 className="mr-1.5 h-3.5 w-3.5" />
                      Detalhes
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/agent/empreendimentos/edit/${empreendimento.id}`}>
                      Gerenciar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              Nenhuma iniciativa cadastrada ainda.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie seu primeiro empreendimento para começar a operar na plataforma.
            </p>
            <Button asChild className="mt-5">
              <Link href="/agent/empreendimentos/create">
                <Plus className="mr-1.5 h-4 w-4" />
                Criar primeira iniciativa
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
