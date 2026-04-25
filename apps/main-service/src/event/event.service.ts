import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService, AuditType } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/user-context.interface';
import { NotificationGatewayService } from '../notification/notification-gateway.service';
import { EventRepository } from './event.repository';
import { CreateEventDto } from './dto/create-event.dto';
import { RsvpEventDto } from './dto/rsvp-event.dto';
import {
  NotificationScope,
  NotificationType,
} from '@prisma/client';

@Injectable()
export class EventService {
  constructor(
    private readonly events: EventRepository,
    private readonly audit: AuditService,
    private readonly notifications: NotificationGatewayService,
  ) {}

  listAll() {
    return this.events.listAll();
  }

  /**
   * Retorna eventos no formato FullCalendar:
   * { id, title, start, end?, extendedProps: { description, location, isOnline, isCancelled, link, confirmedCount } }
   */
  async listCalendarEvents() {
    const events = await this.events.listAll();
    return events.map((ev) => ({
      id: ev.id,
      title: ev.title,
      start: ev.date.toISOString(),
      end: ev.endDate?.toISOString() ?? null,
      color: ev.isCancelled ? '#9ca3af' : undefined,
      extendedProps: {
        description: ev.description,
        location: ev.location,
        isOnline: ev.isOnline,
        isCancelled: ev.isCancelled,
        link: ev.link ?? null,
        confirmedCount: ev._count?.rsvps ?? 0,
      },
    }));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const event = await this.events.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    await this.audit.logAction(user.sub, AuditType.AUDIT, `Visualização do evento ${id}.`);
    return event;
  }

  async create(dto: CreateEventDto, user: AuthenticatedUser) {
    const event = await this.events.create({
      title: dto.title,
      description: dto.description,
      date: new Date(dto.date),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      location: dto.location,
      link: dto.link,
      isOnline: dto.isOnline ?? false,
      createdById: user.sub,
    });

    await this.audit.logAction(user.sub, AuditType.TECHNICAL, `Criação do evento ${event.id}.`);

    await this.notifications.notify({
      type: NotificationType.EVENT_REMINDER,
      scope: NotificationScope.PLATFORM,
      title: `Novo evento: ${event.title}`,
      message: `Um novo evento foi publicado para a plataforma em ${new Date(event.date).toLocaleDateString('pt-BR')}.`,
      actionUrl: '/agent/events',
      sourceEntityType: 'event',
      sourceEntityId: event.id,
      senderSystemLabel: 'Eventos Globus Dei',
      metadata: {
        eventId: event.id,
        location: event.location,
        isOnline: event.isOnline,
      },
      recipientGroups: ['ALL_AGENTS'],
      recipients: [],
    });

    await this.notifications.notify({
      type: NotificationType.EVENT_REMINDER,
      scope: NotificationScope.PLATFORM,
      title: `Novo evento: ${event.title}`,
      message: `Um novo evento foi publicado para a plataforma em ${new Date(event.date).toLocaleDateString('pt-BR')}.`,
      actionUrl: '/colaborador/events',
      sourceEntityType: 'event',
      sourceEntityId: event.id,
      senderSystemLabel: 'Eventos Globus Dei',
      metadata: {
        eventId: event.id,
        location: event.location,
        isOnline: event.isOnline,
      },
      recipientGroups: ['ALL_COLLABORATORS'],
      recipients: [],
    });

    return event;
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const event = await this.events.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    const updated = await this.events.cancel(id);
    await this.audit.logAction(user.sub, AuditType.TECHNICAL, `Cancelamento do evento ${id}.`);

    await this.notifications.notify({
      type: NotificationType.EVENT_REMINDER,
      scope: NotificationScope.PLATFORM,
      title: `Evento cancelado: ${event.title}`,
      message: 'Um evento programado foi cancelado e a agenda da plataforma foi atualizada.',
      actionUrl: '/agent/events',
      sourceEntityType: 'event',
      sourceEntityId: event.id,
      senderSystemLabel: 'Eventos Globus Dei',
      metadata: {
        eventId: event.id,
        cancelled: true,
      },
      recipientGroups: ['ALL_AGENTS'],
      recipients: [],
    });

    await this.notifications.notify({
      type: NotificationType.EVENT_REMINDER,
      scope: NotificationScope.PLATFORM,
      title: `Evento cancelado: ${event.title}`,
      message: 'Um evento programado foi cancelado e a agenda da plataforma foi atualizada.',
      actionUrl: '/colaborador/events',
      sourceEntityType: 'event',
      sourceEntityId: event.id,
      senderSystemLabel: 'Eventos Globus Dei',
      metadata: {
        eventId: event.id,
        cancelled: true,
      },
      recipientGroups: ['ALL_COLLABORATORS'],
      recipients: [],
    });

    return updated;
  }

  async rsvp(id: string, dto: RsvpEventDto, user: AuthenticatedUser) {
    const event = await this.events.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    if (event.isCancelled) {
      throw new ForbiddenException('Cannot RSVP to a cancelled event.');
    }

    const rsvp = await this.events.upsertRsvp(id, user.sub, dto.confirmed);
    const action = dto.confirmed ? 'confirmação' : 'cancelamento de presença';
    await this.audit.logAction(user.sub, AuditType.AUDIT, `RSVP (${action}) no evento ${id}.`);
    return rsvp;
  }

  async getMyRsvp(id: string, user: AuthenticatedUser) {
    const event = await this.events.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    return this.events.findRsvp(id, user.sub);
  }
}
