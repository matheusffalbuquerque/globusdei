import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const AGENT_SELECT = {
  id: true, name: true, email: true, city: true, country: true,
  publicBio: true, status: true,
} as const;

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
      data: { senderId, receiverId },
    });
  }

  accept(id: string) {
    return this.prisma.connection.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });
  }

  reject(id: string) {
    return this.prisma.connection.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  remove(id: string) {
    return this.prisma.connection.delete({ where: { id } });
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
        sender: { select: AGENT_SELECT },
        receiver: { select: AGENT_SELECT },
      },
    });
  }

  listPending(agentId: string) {
    return this.prisma.connection.findMany({
      where: { receiverId: agentId, status: 'PENDING' },
      include: { sender: { select: AGENT_SELECT } },
    });
  }

  listSentPending(agentId: string) {
    return this.prisma.connection.findMany({
      where: { senderId: agentId, status: 'PENDING' },
      include: { receiver: { select: AGENT_SELECT } },
    });
  }

  /** Todos os agentes ativos exceto o próprio, com status de conexão inline */
  async listAllWithStatus(meId: string) {
    const [agents, connections] = await Promise.all([
      this.prisma.agent.findMany({
        where: { id: { not: meId }, isActive: true },
        select: AGENT_SELECT,
        orderBy: { name: 'asc' },
      }),
      this.prisma.connection.findMany({
        where: {
          OR: [{ senderId: meId }, { receiverId: meId }],
        },
        select: { id: true, senderId: true, receiverId: true, status: true },
      }),
    ]);

    return agents.map((agent) => {
      const conn = connections.find(
        (c) => c.senderId === agent.id || c.receiverId === agent.id,
      );
      return {
        ...agent,
        connection: conn
          ? {
              id: conn.id,
              status: conn.status,
              isSender: conn.senderId === meId,
            }
          : null,
      };
    });
  }
}
