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
  XCircle,
} from 'lucide-react';

import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
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
  _count?: { rsvps: number };
};

type RsvpMap = Record<string, boolean | null>; // eventId → confirmed | null (sem RSVP)

export default function AgentEventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<RsvpMap>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingRsvp, setLoadingRsvp] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadEvents = async () => {
    try {
      const data = await apiFetch('/events', { session: session as AppSession });
      setEvents(data);
      setError(null);
      // Carrega RSVPs do agente para cada evento em paralelo
      const rsvpResults = await Promise.allSettled(
        (data as EventItem[]).map((ev) =>
          apiFetch(`/events/${ev.id}/rsvp/me`, { session: session as AppSession }).then(
            (r) => ({ id: ev.id, confirmed: r?.confirmed ?? null }),
          ).catch(() => ({ id: ev.id, confirmed: null as null })),
        ),
      );
      const map: RsvpMap = {};
      for (const result of rsvpResults) {
        if (result.status === 'fulfilled') {
          map[result.value.id] = result.value.confirmed;
        }
      }
      setRsvps(map);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (session) void loadEvents();
  }, [session]);

  const handleRsvp = async (eventId: string, confirmed: boolean) => {
    setLoadingRsvp(eventId);
    try {
      await apiFetch(`/events/${eventId}/rsvp`, {
        method: 'POST',
        session: session as AppSession,
        body: JSON.stringify({ confirmed }),
      });
      setRsvps((prev) => ({ ...prev, [eventId]: confirmed }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingRsvp(null);
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
            Agenda da rede
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Eventos</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Acompanhe os eventos programados e confirme sua presença.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Tabela de eventos */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Próximos eventos
            </p>
            <CardTitle className="mt-0.5 text-base">Calendário da rede</CardTitle>
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
                    <TableHead>Evento</TableHead>
                    <TableHead className="w-40">Data</TableHead>
                    <TableHead className="w-28">Formato</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-44">Minha presença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((event) => {
                    const myRsvp = rsvps[event.id];
                    const isLoading = loadingRsvp === event.id;
                    const isPast = new Date(event.date) < new Date();

                    return (
                      <TableRow key={event.id} className={cn(event.isCancelled && 'opacity-50')}>
                        <TableCell>
                          <p className="font-medium text-foreground">{event.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {event.description}
                          </p>
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
                          {event.isCancelled ? (
                            <Badge variant="destructive" className="text-[10px]">Cancelado</Badge>
                          ) : isPast ? (
                            <Badge variant="secondary" className="text-[10px]">Encerrado</Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">Ativo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {event.isCancelled || isPast ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : myRsvp === true ? (
                            <div className="flex items-center gap-1.5">
                              <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Confirmado
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] text-muted-foreground"
                                disabled={isLoading}
                                onClick={() => void handleRsvp(event.id, false)}
                              >
                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancelar'}
                              </Button>
                            </div>
                          ) : myRsvp === false ? (
                            <div className="flex items-center gap-1.5">
                              <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                <XCircle className="h-4 w-4" />
                                Não vou
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] text-primary"
                                disabled={isLoading}
                                onClick={() => void handleRsvp(event.id, true)}
                              >
                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmar'}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs"
                                disabled={isLoading}
                                onClick={() => void handleRsvp(event.id, true)}
                              >
                                {isLoading ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                )}
                                Confirmar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs"
                                disabled={isLoading}
                                onClick={() => void handleRsvp(event.id, false)}
                              >
                                Não vou
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              <p className="text-sm text-muted-foreground">Nenhum evento programado no momento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
