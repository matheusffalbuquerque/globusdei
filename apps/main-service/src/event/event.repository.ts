import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.event.findMany({
      orderBy: { date: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  create(data: { title: string; description: string; date: Date; location?: string; isOnline?: boolean; createdById?: string }) {
    return this.prisma.event.create({ data });
  }
}
