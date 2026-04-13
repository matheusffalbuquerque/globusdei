import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AgentRepository } from '../agent/agent.repository';
import { NotificationGatewayService } from '../notification/notification-gateway.service';
import { ConnectionRepository } from './connection.repository';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import {
  NotificationScope,
  NotificationTargetType,
  NotificationType,
} from '@prisma/client';

@Injectable()
export class ConnectionService {
  constructor(
    private readonly connections: ConnectionRepository,
    private readonly agents: AgentRepository,
    private readonly notificationGateway: NotificationGatewayService,
  ) {}

  private async me(user: AuthenticatedUser) {
    return this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
  }

  async request(user: AuthenticatedUser, receiverId: string) {
    const sender = await this.me(user);

    if (sender.id === receiverId) {
      throw new BadRequestException('You cannot connect with yourself.');
    }

    const receiver = await this.connections.findAgent(receiverId);
    if (!receiver) throw new NotFoundException('Receiver not found.');

    const existing = await this.connections.findExisting(sender.id, receiverId);
    if (existing) throw new BadRequestException('Connection already exists or is pending.');

    const connection = await this.connections.create(sender.id, receiverId);

    await this.notificationGateway.notify({
      type: NotificationType.CONNECTION_REQUEST,
      scope: NotificationScope.PERSONAL,
      title: 'Nova solicitação de conexão',
      message: `${sender.name} enviou uma solicitação de conexão para você.`,
      actionUrl: '/agent/network',
      sourceEntityType: 'connection',
      sourceEntityId: connection.id,
      senderSystemLabel: 'Rede Global',
      metadata: {
        senderId: sender.id,
        senderName: sender.name,
      },
      recipients: [
        {
          targetType: NotificationTargetType.AGENT,
          agentId: receiverId,
        },
      ],
    });

    return connection;
  }

  async accept(user: AuthenticatedUser, connectionId: string) {
    const agent = await this.me(user);
    const connection = await this.connections.findById(connectionId);

    if (!connection) throw new NotFoundException('Connection not found.');
    if (connection.receiverId !== agent.id)
      throw new ForbiddenException('Only the receiver can accept this request.');

    return this.connections.accept(connectionId);
  }

  async reject(user: AuthenticatedUser, connectionId: string) {
    const agent = await this.me(user);
    const connection = await this.connections.findById(connectionId);

    if (!connection) throw new NotFoundException('Connection not found.');
    if (connection.receiverId !== agent.id)
      throw new ForbiddenException('Only the receiver can reject this request.');

    return this.connections.reject(connectionId);
  }

  async remove(user: AuthenticatedUser, connectionId: string) {
    const agent = await this.me(user);
    const connection = await this.connections.findById(connectionId);

    if (!connection) throw new NotFoundException('Connection not found.');
    if (connection.senderId !== agent.id && connection.receiverId !== agent.id)
      throw new ForbiddenException('You are not part of this connection.');

    return this.connections.remove(connectionId);
  }

  async list(user: AuthenticatedUser) {
    const agent = await this.me(user);
    return this.connections.listAccepted(agent.id);
  }

  async listPending(user: AuthenticatedUser) {
    const agent = await this.me(user);
    return this.connections.listPending(agent.id);
  }

  async listSentPending(user: AuthenticatedUser) {
    const agent = await this.me(user);
    return this.connections.listSentPending(agent.id);
  }

  /** Todos os agentes com status de conexão em relação ao usuário autenticado */
  async listAllWithStatus(user: AuthenticatedUser) {
    const agent = await this.me(user);
    return this.connections.listAllWithStatus(agent.id);
  }
}
