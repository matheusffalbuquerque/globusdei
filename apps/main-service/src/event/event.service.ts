import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditType } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

/**
 * EventService
 * Manages Globus Dei regional and global missionary events.
 */
@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findOne(id: string, requesterActorId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });
    
    if (!event) {
      throw new NotFoundException(`Event ${id} not found.`);
    }

    await this.audit.logAction(
      requesterActorId,
      AuditType.AUDIT,
      `Visualização de evento global: ${event.title}`
    );

    return event;
  }

  async create(data: Prisma.EventCreateInput, requesterActorId: string) {
    const novo = await this.prisma.event.create({ data });
    
    await this.audit.logAction(
      requesterActorId,
      AuditType.TECHNICAL,
      `Novo evento organizado: ${novo.title}`
    );

    return novo;
  }
}
