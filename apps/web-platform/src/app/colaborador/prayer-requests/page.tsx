'use client';

import { Fragment, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  Search,
  HandHeart,
} from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../lib/utils';

const PAGE_SIZE = 10;

type PrayerItem = {
  id: string;
  request: string;
  status: 'PENDING' | 'ANSWERED';
  answeredAt: string | null;
  internalNote: string | null;
  createdAt: string;
  agent: { id: string; name: string; email: string; city: string | null; country: string | null };
  answeredBy: { id: string; name: string } | null;
};

export default function CollaboratorPrayerRequestsPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();

  const [tab, setTab] = useState<'PENDING' | 'ANSWERED'>('PENDING');
  const [items, setItems] = useState<PrayerItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async (status: 'PENDING' | 'ANSWERED') => {
    try {
      const path = status === 'PENDING' ? '/prayer-requests/pending' : '/prayer-requests/answered';
      const data = await apiFetch(path, { session: session as AppSession });
      setItems(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (session) {
      setPage(1);
      setSearch('');
      void load(tab);
    }
  }, [session, tab]);

  const handleAnswer = async (id: string) => {
    setSubmitting(true);
    try {
      await apiFetch(`/prayer-requests/${id}/answer`, {
        method: 'PATCH',
        session: session as AppSession,
        body: JSON.stringify({ internalNote: note || undefined }),
      });
      setAnsweringId(null);
      setNote('');
      await load(tab);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtro por nome do agente ou trecho do pedido
  const filtered = items.filter((it) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      it.agent.name.toLowerCase().includes(q) ||
      it.request.toLowerCase().includes(q) ||
      (it.agent.city ?? '').toLowerCase().includes(q) ||
      (it.agent.country ?? '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Grupo de intercessão
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pedidos de Oração
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe e atenda os pedidos de intercessão enviados pelos agentes da rede.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Tabs + Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div className="flex rounded-lg border border-border bg-muted/40 p-1 gap-1">
              <button
                onClick={() => setTab('PENDING')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                  tab === 'PENDING'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                Pendentes
                <Badge variant="warning" className="ml-1 text-[10px] px-1.5 py-0">
                  {items.length > 0 && tab === 'PENDING' ? items.length : ''}
                </Badge>
              </button>
              <button
                onClick={() => setTab('ANSWERED')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                  tab === 'ANSWERED'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Atendidos
              </button>
            </div>

            {/* Busca */}
            <div className="flex h-9 w-64 items-center gap-2 rounded-md border border-border bg-background px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Buscar por agente, local ou pedido…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <HandHeart className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {tab === 'PENDING' ? 'Nenhum pedido pendente.' : 'Nenhum pedido atendido ainda.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">Agente / Origem</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead className="w-36">Enviado em</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    {tab === 'PENDING' && (
                      <TableHead className="w-28 text-right">Ação</TableHead>
                    )}
                    {tab === 'ANSWERED' && (
                      <TableHead className="w-36">Atendido em</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((item) => (
                    <Fragment key={item.id}>
                      <TableRow>
                        <TableCell>
                          <p className="font-medium text-foreground">{item.agent.name}</p>
                          {(item.agent.city || item.agent.country) && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {[item.agent.city, item.agent.country].filter(Boolean).join(', ')}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.agent.email}</p>
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-3 text-sm text-foreground">{item.request}</p>
                          {tab === 'ANSWERED' && item.internalNote && (
                            <p className="mt-1 text-xs text-muted-foreground italic">
                              Nota: {item.internalNote}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          {item.status === 'PENDING' ? (
                            <Badge variant="warning" className="text-[10px]">Pendente</Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">Atendido</Badge>
                          )}
                        </TableCell>
                        {tab === 'PENDING' && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                setAnsweringId(answeringId === item.id ? null : item.id)
                              }
                            >
                              {answeringId === item.id ? 'Cancelar' : 'Atender'}
                            </Button>
                          </TableCell>
                        )}
                        {tab === 'ANSWERED' && (
                          <TableCell className="text-sm text-muted-foreground">
                            {item.answeredAt
                              ? new Date(item.answeredAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                            {item.answeredBy && (
                              <p className="text-xs text-muted-foreground">
                                por {item.answeredBy.name}
                              </p>
                            )}
                          </TableCell>
                        )}
                      </TableRow>

                      {/* Inline: confirmar atendimento */}
                      {tab === 'PENDING' && answeringId === item.id && (
                        <TableRow key={`${item.id}-answer`} className="bg-muted/30">
                          <TableCell colSpan={5} className="py-3">
                            <div className="flex items-end gap-3">
                              <div className="flex-1 space-y-1">
                                <label className="text-xs font-medium text-foreground">
                                  Nota interna (opcional)
                                </label>
                                <Textarea
                                  rows={2}
                                  placeholder="Adicione uma nota de acompanhamento…"
                                  value={note}
                                  onChange={(e) => setNote(e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <Button
                                size="sm"
                                disabled={submitting}
                                onClick={() => handleAnswer(item.id)}
                                className="h-9 gap-1.5"
                              >
                                {submitting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Confirmar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {filtered.length} pedido{filtered.length !== 1 ? 's' : ''} •{' '}
                    página {page} de {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
