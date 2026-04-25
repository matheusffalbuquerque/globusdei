'use client';

import { Clock, ExternalLink, MapPin, Monitor, Users } from 'lucide-react';

import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

/** Props do evento selecionado vindas do FullCalendar extendedProps */
export type CalendarEventDetail = {
  id: string;
  title: string;
  start: string;
  end?: string | null;
  description: string;
  location?: string | null;
  isOnline: boolean;
  isCancelled: boolean;
  link?: string | null;
  confirmedCount: number;
};

type EventDetailModalProps = {
  event: CalendarEventDetail | null;
  open: boolean;
  onClose: () => void;
};

/** Formata hora no padrão brasileiro (ex: 14:30) */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formata data completa (ex: 22 de abr. de 2026) */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Modal de detalhe do evento.
 * Exibe título, horário, descrição, link (se houver), localização e contagem de confirmados.
 */
export function EventDetailModal({ event, open, onClose }: EventDetailModalProps) {
  if (!event) return null;

  const isPast = new Date(event.start) < new Date();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-lg font-bold leading-snug">
              {event.title}
            </DialogTitle>
            <div className="flex-shrink-0 pt-0.5">
              {event.isCancelled ? (
                <Badge variant="destructive" className="text-[10px]">Cancelado</Badge>
              ) : isPast ? (
                <Badge variant="secondary" className="text-[10px]">Encerrado</Badge>
              ) : (
                <Badge variant="success" className="text-[10px]">Ativo</Badge>
              )}
            </div>
          </div>
          <DialogDescription className="sr-only">
            Detalhes do evento {event.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Horário */}
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">
              {formatDate(event.start)}
              {' · '}
              {formatTime(event.start)}
              {event.end && ` — ${formatTime(event.end)}`}
            </span>
          </div>

          {/* Formato + Localização */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {event.isOnline ? (
              <Monitor className="h-4 w-4 flex-shrink-0" />
            ) : (
              <MapPin className="h-4 w-4 flex-shrink-0" />
            )}
            <span>
              {event.isOnline ? 'Online' : 'Presencial'}
              {event.location && ` · ${event.location}`}
            </span>
          </div>

          {/* Confirmados */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>
              {event.confirmedCount}{' '}
              {event.confirmedCount === 1 ? 'confirmado' : 'confirmados'}
            </span>
          </div>

          {/* Descrição */}
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Link */}
          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Acessar link do evento
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
