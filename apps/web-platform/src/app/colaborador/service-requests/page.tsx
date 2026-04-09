'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Inbox, Lock } from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import {
  formatServiceRequestCategory,
  formatServiceRequestStatus,
  type AppSession,
} from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';

function requestStatusVariant(status: string) {
  const s = status?.toUpperCase();
  if (s === 'OPEN') return 'info' as const;
  if (s === 'IN_PROGRESS') return 'warning' as const;
  if (s === 'RESOLVED' || s === 'CLOSED') return 'success' as const;
  return 'secondary' as const;
}

/**
 * CollaboratorServiceRequestsPage adapts the triage workflow to collaborator permissions.
 */
export default function CollaboratorServiceRequestsPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const [requests, setRequests] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!permissions.canManageRequests) {
      return;
    }

    try {
      const data = await apiFetch('/platform/service-requests', {
        session: session as AppSession,
      });
      setRequests(data);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (session && permissions.canManageRequests) {
      void loadRequests();
    }
  }, [permissions.canManageRequests, session]);

  const updateStatus = async (id: string, statusValue: string) => {
    try {
      await apiFetch(`/platform/service-requests/${id}/status`, {
        method: 'PATCH',
        session: session as AppSession,
        body: JSON.stringify({ status: statusValue, internalNotes: notes[id] || undefined }),
      });
      await loadRequests();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  if (!permissions.canManageRequests) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Lock className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="font-semibold text-foreground">Solicitações indisponíveis para seu papel atual</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              O backend exige papéis locais de pessoas ou projetos para triagem deste módulo, então o fluxo foi bloqueado aqui também.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Fila operacional
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Solicitações de apoio
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Atualize status e registre notas internas para acompanhamento do suporte prestado aos agentes.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {request.agent.name}
                    </p>
                    <CardTitle className="mt-0.5 text-base">
                      {formatServiceRequestCategory(request.category)}
                    </CardTitle>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant={requestStatusVariant(request.status)}>
                        {formatServiceRequestStatus(request.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <Select
                    value={request.status}
                    onChange={(e) => void updateStatus(request.id, e.target.value)}
                    className="shrink-0 sm:w-48"
                  >
                    <option value="OPEN">Aberta</option>
                    <option value="IN_PROGRESS">Em andamento</option>
                    <option value="RESOLVED">Resolvida</option>
                    <option value="CLOSED">Encerrada</option>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {request.description}
                </p>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Notas internas</label>
                  <Textarea
                    rows={3}
                    value={notes[request.id] ?? request.internalNotes ?? ''}
                    onChange={(e) =>
                      setNotes((current) => ({ ...current, [request.id]: e.target.value }))
                    }
                    placeholder="Registre andamento, encaminhamentos ou dependências."
                  />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhuma solicitação aberta para triagem.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
