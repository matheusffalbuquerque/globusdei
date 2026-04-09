'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';

import { apiFetch } from '../../../lib/api';
import {
  formatServiceRequestCategory,
  formatServiceRequestStatus,
  type AppSession,
} from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select } from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Textarea } from '../../../components/ui/textarea';

const CATEGORIES = [
  { value: 'TECHNICAL', label: 'Técnico' },
  { value: 'PSYCHOLOGICAL', label: 'Psicológico' },
  { value: 'MEDICAL', label: 'Médico' },
  { value: 'SPIRITUAL', label: 'Espiritual' },
  { value: 'MENTORSHIP', label: 'Mentoria' },
  { value: 'LEGAL', label: 'Jurídico' },
] as const;

const PAGE_SIZE = 8;

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
  const [page, setPage] = useState(1);

  const loadRequests = async () => {
    try {
      const data = await apiFetch('/platform/service-requests/mine', {
        session: session as AppSession,
      });
      setRequests(data);
      setPage(1);
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

  const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  const paginated = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Form panel */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Novo chamado
          </p>
          <CardTitle className="mt-0.5 text-base">Solicitar apoio da equipe</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registre necessidades técnicas, médicas, jurídicas ou de mentoria para acompanhamento
            do time interno.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={submitRequest} className="grid gap-5 sm:grid-cols-[1fr_2fr]">
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
              <label className="text-sm font-medium text-foreground">Descrição da necessidade</label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Explique o contexto, urgência e o tipo de ajuda esperado."
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Enviando…' : 'Registrar solicitação'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* History table */}
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
        <CardContent className="p-0">
          {requests.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-28">Data</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {formatServiceRequestCategory(request.category)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={requestStatusVariant(request.status)}
                          className="text-[10px]"
                        >
                          {formatServiceRequestStatus(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {request.description}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <span className="text-xs text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-b-lg border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma solicitação registrada até o momento.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
