'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Monitor,
  PlusCircle,
  Users,
  XCircle,
} from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
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

const PAGE_SIZE = 8;

type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string | null;
  isOnline: boolean;
  isCancelled: boolean;
  createdAt: string;
  _count?: { rsvps: number };
};

const emptyForm = {
  title: '',
  description: '',
  date: '',
  location: '',
  isOnline: false,
};

export default function CollaboratorEventsPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const canCreate =
    permissions.canManageProjects || (permissions as any).isAdmin;

  const load = async () => {
    try {
      const data = await apiFetch('/events', { session: session as AppSession });
      setEvents(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (session) void load();
  }, [session]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await apiFetch('/events', {
        method: 'POST',
        session: session as AppSession,
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          date: new Date(form.date).toISOString(),
          location: form.location || undefined,
          isOnline: form.isOnline,
        }),
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await apiFetch(`/events/${id}/cancel`, {
        method: 'PATCH',
        session: session as AppSession,
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCancellingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const paginated = events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Gestão de eventos
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Eventos</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Crie e gerencie eventos da rede. Acompanhe as confirmações de presença dos agentes.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Formulário de criação */}
      {canCreate && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-primary" />
              <div>
                <CardTitle className="mt-0.5 text-base">Criar evento</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {formError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Título</label>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Nome do evento"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Descrição</label>
                  <Textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Descreva o objetivo e o público do evento."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Data e hora</label>
                  <Input
                    type="datetime-local"
                    required
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Local <span className="text-muted-foreground">(opcional)</span>
                  </label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Endereço ou link da reunião"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={form.isOnline}
                  onChange={(e) => setForm((f) => ({ ...f, isOnline: e.target.checked }))}
                />
                Evento online
              </label>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Criando…' : 'Criar evento'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabela de eventos */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Calendário
            </p>
            <CardTitle className="mt-0.5 text-base">Todos os eventos</CardTitle>
          </div>
          <Badge variant="secondary" className="font-bold">
            {events.length} {events.length === 1 ? 'evento' : 'eventos'}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {events.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead className="w-36">Data</TableHead>
                    <TableHead className="w-28">Formato</TableHead>
                    <TableHead className="w-28">Confirmados</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((event) => (
                    <TableRow key={event.id} className={cn(event.isCancelled && 'opacity-50')}>
                      <TableCell>
                        <p className="font-medium text-foreground">{event.title}</p>
                        {event.location && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {event.isOnline ? (
                            <><Monitor className="h-3.5 w-3.5" /> Online</>
                          ) : (
                            <><MapPin className="h-3.5 w-3.5" /> Presencial</>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {event._count?.rsvps ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {event.isCancelled ? (
                          <Badge variant="destructive" className="text-[10px]">Cancelado</Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!event.isCancelled && canCreate && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            disabled={cancellingId === event.id}
                            onClick={() => void handleCancel(event.id)}
                          >
                            {cancellingId === event.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum evento cadastrado ainda.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
