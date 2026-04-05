import { Injectable, NotFoundException } from '@nestjs/common';

import { AuditService, AuditType } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/user-context.interface';
import { EventRepository } from './event.repository';
import { CreateEventDto } from './dto/create-event.dto';

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
}
