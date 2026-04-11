'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MapPin,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';

import { apiFetch } from '../../../../../lib/api';
import { type AppSession } from '../../../../../lib/auth';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Separator } from '../../../../../components/ui/separator';

type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

type AgentDetail = {
  id: string;
  name: string;
  email: string;
  city: string | null;
  country: string | null;
  vocationType: string;
  publicBio: string | null;
  status: string;
  connection: {
    id: string;
    status: ConnectionStatus;
    isSender: boolean;
  } | null;
};

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export default function AgentProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const agentId = params?.id as string;

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const s = session as AppSession;

  const loadAgent = async () => {
    if (!session || !agentId) return;
    try {
      // Fetch all agents and find the one with matching id
      const all: AgentDetail[] = await apiFetch('/connections/agents', { session: s });
      const found = all.find((a) => a.id === agentId);
      if (!found) throw new Error('Agente não encontrado.');
      setAgent(found);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) void loadAgent();
  }, [session, agentId]);

  const handleConnect = async () => {
    if (!agent) return;
    setActionLoading(true);
    try {
      await apiFetch('/connections/requests', {
        method: 'POST', session: s,
        body: JSON.stringify({ receiverId: agent.id }),
      });
      await loadAgent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!agent?.connection) return;
    setActionLoading(true);
    try {
      await apiFetch(`/connections/${agent.connection.id}/accept`, { method: 'POST', session: s });
      await loadAgent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!agent?.connection) return;
    setActionLoading(true);
    try {
      await apiFetch(`/connections/${agent.connection.id}/reject`, { method: 'POST', session: s });
      await loadAgent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!agent?.connection) return;
    setActionLoading(true);
    try {
      await apiFetch(`/connections/${agent.connection.id}`, { method: 'DELETE', session: s });
      await loadAgent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Agente não encontrado.'}
        </div>
      </div>
    );
  }

  const conn = agent.connection;
  const isAccepted = conn?.status === 'ACCEPTED';
  const isPendingReceived = conn?.status === 'PENDING' && !conn.isSender;
  const isPendingSent = conn?.status === 'PENDING' && conn.isSender;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Voltar para Rede Global
      </Button>

      <Card>
        {/* Banner */}
        <div className="relative h-32 rounded-t-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <div className="absolute -bottom-8 left-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-primary/15 text-xl font-bold text-primary shadow-md">
            {initials(agent.name)}
          </div>
        </div>

        <CardContent className="pt-12 pb-6">
          {/* Actions header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">{agent.name}</h1>
              {agent.vocationType && (
                <p className="text-sm text-muted-foreground">{agent.vocationType}</p>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              {!conn && (
                <Button size="sm" className="gap-1.5" disabled={actionLoading} onClick={handleConnect}>
                  <UserPlus className="h-4 w-4" /> Conectar
                </Button>
              )}
              {isPendingReceived && (
                <>
                  <Button size="sm" className="gap-1.5" disabled={actionLoading} onClick={handleAccept}>
                    <CheckCircle2 className="h-4 w-4" /> Aceitar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={actionLoading} onClick={handleReject}>
                    <X className="h-4 w-4" /> Recusar
                  </Button>
                </>
              )}
              {(isAccepted || isPendingSent) && (
                <Button size="sm" variant="outline" className="text-muted-foreground" disabled={actionLoading} onClick={handleRemove}>
                  {isAccepted ? 'Desconectar' : 'Cancelar solicitação'}
                </Button>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mt-3">
            {isAccepted && (
              <Badge variant="secondary" className="gap-1 text-emerald-600">
                <UserCheck className="h-3 w-3" /> Conectado
              </Badge>
            )}
            {isPendingSent && (
              <Badge variant="secondary" className="gap-1 text-amber-600">
                <Clock className="h-3 w-3" /> Solicitação enviada
              </Badge>
            )}
            {isPendingReceived && (
              <Badge variant="secondary" className="gap-1 text-blue-600">
                <Clock className="h-3 w-3" /> Solicitação recebida
              </Badge>
            )}
          </div>

          <Separator className="my-5" />

          {/* Info fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</p>
                <p className="text-sm text-foreground">{agent.email}</p>
              </div>
            </div>

            {(agent.city || agent.country) && (
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Localização</p>
                  <p className="text-sm text-foreground">
                    {[agent.city, agent.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</p>
                <Badge variant="outline" className="mt-0.5 text-xs capitalize">
                  {agent.status?.toLowerCase() ?? 'ativo'}
                </Badge>
              </div>
            </div>
          </div>

          {agent.publicBio && (
            <>
              <Separator className="my-5" />
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sobre</p>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{agent.publicBio}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
