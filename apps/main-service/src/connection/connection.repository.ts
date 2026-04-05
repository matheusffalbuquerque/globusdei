import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConnectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAgent(id: string) {
    return this.prisma.agent.findUnique({ where: { id } });
  }

  findById(id: string) {
    return this.prisma.connection.findUnique({ where: { id } });
  }

  findExisting(senderId: string, receiverId: string) {
    return this.prisma.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });
  }

  create(senderId: string, receiverId: string) {
    return this.prisma.connection.create({
      data: {
        senderId,
        receiverId,
      },
    });
  }

  accept(id: string) {
    return this.prisma.connection.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });
  }

  listAccepted(agentId: string) {
    return this.prisma.connection.findMany({
      where: {
        OR: [
          { senderId: agentId, status: 'ACCEPTED' },
          { receiverId: agentId, status: 'ACCEPTED' },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  listPending(agentId: string) {
    return this.prisma.connection.findMany({
      where: {
        receiverId: agentId,
        status: 'PENDING',
      },
      include: {
        sender: true,
      },
    });
  }
}
