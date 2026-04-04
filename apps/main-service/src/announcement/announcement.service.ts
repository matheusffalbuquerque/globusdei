import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a platform announcement (Staff only action).
   */
  async create(title: string, content: string, type: string, authorId: string, targetId?: string) {
    return this.prisma.announcement.create({
      data: {
        title,
        content,
        type,
        authorId,
        targetId,
      },
    });
  }

  async listAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to recent
    });
  }

  async getRecentForAgent() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async delete(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
