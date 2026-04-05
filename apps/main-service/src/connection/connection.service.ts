import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AgentRepository } from '../agent/agent.repository';
import { ConnectionRepository } from './connection.repository';
import type { AuthenticatedUser } from '../auth/user-context.interface';

@Injectable()
export class ConnectionService {
  constructor(
    private readonly connections: ConnectionRepository,
    private readonly agents: AgentRepository,
  ) {}

  async request(user: AuthenticatedUser, receiverId: string) {
    const sender = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });

    if (sender.id === receiverId) {
      throw new BadRequestException('You cannot connect with yourself.');
    }

    const receiver = await this.connections.findAgent(receiverId);
    if (!receiver) {
      throw new NotFoundException('Receiver not found.');
    }

    const existing = await this.connections.findExisting(sender.id, receiverId);
    if (existing) {
      throw new BadRequestException('Connection already exists or is pending.');
    }

    return this.connections.create(sender.id, receiverId);
  }

  async accept(user: AuthenticatedUser, connectionId: string) {
    const receiver = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    const connection = await this.connections.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection not found.');
    }

    if (connection.receiverId !== receiver.id) {
      throw new BadRequestException('Only the receiver can accept this request.');
    }

    return this.connections.accept(connectionId);
  }

  async list(user: AuthenticatedUser) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    return this.connections.listAccepted(agent.id);
  }

  async listPending(user: AuthenticatedUser) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    return this.connections.listPending(agent.id);
  }
}
