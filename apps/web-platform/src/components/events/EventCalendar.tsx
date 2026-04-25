'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
import { CalendarDays, Loader2 } from 'lucide-react';

import { apiFetch } from '../../lib/api';
import { type AppSession } from '../../lib/auth';
import { CalendarEventDetail, EventDetailModal } from './EventDetailModal';
import './event-calendar.css';

const MAX_TITLE_CHARS = 22;

/** Trunca o título do evento com reticências */
function truncateTitle(title: string, max = MAX_TITLE_CHARS): string {
  return title.length > max ? `${title.slice(0, max)}…` : title;
}

/** Layout customizado do evento: título truncado + horário à direita */
function renderEventContent(info: EventContentArg) {
  const { isCancelled } = info.event.extendedProps;
  const timeText = info.timeText;

  return (
    <div className={`gd-event-content ${isCancelled ? 'gd-event-cancelled' : ''}`}>
      <span className="gd-event-title">{truncateTitle(info.event.title)}</span>
      {timeText && <span className="gd-event-time">{timeText}</span>}
    </div>
  );
}

/**
 * Componente reutilizável de calendário visual com FullCalendar.
 * Exibe eventos da plataforma em visualização mensal com modal de detalhes ao clicar.
 */
export function EventCalendar() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await apiFetch('/events/calendar', { session: session as AppSession });
      setEvents(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleEventClick = useCallback((info: EventClickArg) => {
    const { extendedProps } = info.event;
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr || null,
      description: extendedProps.description ?? '',
      location: extendedProps.location ?? null,
      isOnline: extendedProps.isOnline ?? false,
      isCancelled: extendedProps.isCancelled ?? false,
      link: extendedProps.link ?? null,
      confirmedCount: extendedProps.confirmedCount ?? 0,
    });
    setModalOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhum evento programado no momento.</p>
      </div>
    );
  }

  return (
    <>
      <div className="gd-calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ptBrLocale}
          height="auto"
          events={events}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          buttonText={{
            today: 'Hoje',
          }}
          dayMaxEvents={3}
          fixedWeekCount={false}
          firstDay={0}
        />
      </div>

      <EventDetailModal
        event={selectedEvent}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
