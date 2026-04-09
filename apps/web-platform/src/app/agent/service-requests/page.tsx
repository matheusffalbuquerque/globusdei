'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Send } from 'lucide-react';

import { apiFetch } from '../../../lib/api';
import {
  formatServiceRequestCategory,
  formatServiceRequestStatus,
  type AppSession,
} from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Textarea } from '../../../components/ui/textarea';
import { Select } from '../../../components/ui/select';

const CATEGORIES = [
  { value: 'TECHNICAL', label: 'Técnico' },
  { value: 'PSYCHOLOGICAL', label: 'Psicológico' },
  { value: 'MEDICAL', label: 'Médico' },
  { value: 'SPIRITUAL', label: 'Espiritual' },
  { value: 'MENTORSHIP', label: 'Mentoria' },
  { value: 'LEGAL', label: 'Jurídico' },
] as const;

function requestStatusVariant(status: string) {
  const s = status?.toUpperCase();
  if (s === 'OPEN') return 'info' as const;
  if (s === 'IN_PROGRESS') return 'warning' as const;
  if (s === 'RESOLVED' || s === 'CLOSED') return 'success' as const;
  return 'secondary' as const;
}

/**
 * AgentServiceRequestsPage manages support requests opened by agents.
 */
export default function AgentServiceRequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({ category: 'TECHNICAL', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await apiFetch('/platform/service-requests/mine', {
        session: session as AppSession,
      });
      setRequests(data);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (session) {
      void loadRequests();
    }
  }, [session]);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiFetch('/platform/service-requests', {
        method: 'POST',
        session: session as AppSession,
        body: JSON.stringify(form),
      });
      setForm({ category: 'TECHNICAL', description: '' });
      await loadRequests();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      {/* Form panel */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Novo chamado
          </p>
          <CardTitle className="mt-0.5 text-base">Solicitar apoio da equipe</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registre necessidades técnicas, médicas, jurídicas ou de mentoria para acompanhamento do time interno.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={submitRequest} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <Select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Descrição da necessidade
              </label>
              <Textarea
                rows={8}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Explique o contexto, urgência e o tipo de ajuda esperado."
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Enviando…' : 'Registrar solicitação'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History panel */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Histórico
            </p>
            <CardTitle className="mt-0.5 text-base">Chamados abertos e concluídos</CardTitle>
          </div>
          <Badge variant="secondary" className="font-bold">
            {requests.length} {requests.length === 1 ? 'item' : 'itens'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length > 0 ? (
            requests.map((request) => (
              <div key={request.id} className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {formatServiceRequestCategory(request.category)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={requestStatusVariant(request.status)} className="text-[10px]">
                      {formatServiceRequestStatus(request.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {request.description}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma solicitação registrada até o momento.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
