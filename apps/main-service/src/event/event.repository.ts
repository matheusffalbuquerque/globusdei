import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.event.findMany({
      orderBy: { date: 'asc' },
      include: {
        _count: { select: { rsvps: { where: { confirmed: true } } } },
      },
    });
  }

  findById(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        rsvps: true,
        _count: { select: { rsvps: { where: { confirmed: true } } } },
      },
    });
  }

  create(data: {
    title: string;
    description: string;
    date: Date;
    endDate?: Date;
    location?: string;
    link?: string;
    isOnline?: boolean;
    createdById?: string;
  }) {
    return this.prisma.event.create({ data });
  }

  cancel(id: string) {
    return this.prisma.event.update({ where: { id }, data: { isCancelled: true } });
  }

  upsertRsvp(eventId: string, agentId: string, confirmed: boolean) {
    return this.prisma.eventRsvp.upsert({
      where: { eventId_agentId: { eventId, agentId } },
      create: { eventId, agentId, confirmed },
      update: { confirmed },
    });
  }

  findRsvp(eventId: string, agentId: string) {
    return this.prisma.eventRsvp.findUnique({
      where: { eventId_agentId: { eventId, agentId } },
    });
  }
}
