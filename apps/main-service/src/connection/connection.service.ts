import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionStatus } from '@prisma/client';

@Injectable()
export class ConnectionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Sends a connection request from one agent to another.
   * Strictly restricted to Agent-to-Agent connections.
   */
  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('You cannot connect with yourself.');
    }

    // Check if agents exist
    const [sender, receiver] = await Promise.all([
      this.prisma.agent.findUnique({ where: { id: senderId } }),
      this.prisma.agent.findUnique({ where: { id: receiverId } }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('One or both agents not found.');
    }

    // Check existing connection
    const existing = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('Connection already exists or is pending.');
    }

    return this.prisma.connection.create({
      data: {
        senderId,
        receiverId,
        status: ConnectionStatus.PENDING,
      },
    });
  }

  async acceptRequest(receiverId: string, connectionId: string) {
    const conn = await this.prisma.connection.findUnique({ where: { id: connectionId } });
    
    if (!conn) throw new NotFoundException('Connection not found.');
    if (conn.receiverId !== receiverId) throw new BadRequestException('Access denied.');
    if (conn.status !== ConnectionStatus.PENDING) throw new BadRequestException('Connection not pending.');

    return this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: ConnectionStatus.ACCEPTED },
    });
  }

  async listConnections(agentId: string) {
    return this.prisma.connection.findMany({
      where: {
        OR: [
          { senderId: agentId, status: ConnectionStatus.ACCEPTED },
          { receiverId: agentId, status: ConnectionStatus.ACCEPTED },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, vocationType: true } },
        receiver: { select: { id: true, name: true, vocationType: true } },
      },
    });
  }

  async listPending(agentId: string) {
    return this.prisma.connection.findMany({
      where: { receiverId: agentId, status: ConnectionStatus.PENDING },
      include: {
        sender: { select: { id: true, name: true, vocationType: true } },
      },
    });
  }
}
