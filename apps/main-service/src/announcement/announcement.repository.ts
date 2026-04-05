import { Injectable } from '@nestjs/common';
import { AnnouncementType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(title: string, content: string, type: AnnouncementType, authorId: string, targetId?: string) {
    return this.prisma.announcement.create({
      data: { title, content, type, authorId, targetId },
    });
  }

  listRecent(limit = 10) {
    return this.prisma.announcement.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  delete(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
