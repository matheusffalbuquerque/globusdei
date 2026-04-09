import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService, AuditType } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/user-context.interface';
import { EventRepository } from './event.repository';
import { CreateEventDto } from './dto/create-event.dto';
import { RsvpEventDto } from './dto/rsvp-event.dto';

@Injectable()
export class EventService {
  constructor(
    private readonly events: EventRepository,
    private readonly audit: AuditService,
  ) {}

  listAll() {
    return this.events.listAll();
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
      location: dto.location,
      isOnline: dto.isOnline ?? false,
      createdById: user.sub,
    });

    await this.audit.logAction(user.sub, AuditType.TECHNICAL, `Criação do evento ${event.id}.`);
    return event;
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const event = await this.events.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    const updated = await this.events.cancel(id);
    await this.audit.logAction(user.sub, AuditType.TECHNICAL, `Cancelamento do evento ${id}.`);
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
