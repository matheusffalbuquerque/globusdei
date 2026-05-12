import { Injectable } from '@nestjs/common';
import {
  NotificationScope,
  NotificationTargetType,
  NotificationType,
  type Prisma,
} from '@prisma/client';

import { PrismaService } from './prisma/prisma.service';

/**
 * Keeps notification persistence concerns isolated from the service layer.
 */
@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCollaboratorByActor(sub: string, email: string) {
    return this.prisma.collaborator.findFirst({
      where: {
        OR: [{ authSubject: sub }, { email }],
      },
    });
  }

  upsertAgentFromIdentity(params: {
    authSubject: string;
    email: string;
    name: string;
  }) {
    return this.prisma.agent.upsert({
      where: { email: params.email },
      update: {
        authSubject: params.authSubject,
        name: params.name,
      },
      create: {
        authSubject: params.authSubject,
        email: params.email,
        name: params.name,
        status: 'ENTERED',
      },
    });
  }

  listAgentInitiatives(agentId: string) {
    return this.prisma.empreendimento.findMany({
      where: {
        OR: [{ ownerId: agentId }, { agents: { some: { agentId } } }],
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  findAgent(id: string) {
    return this.prisma.agent.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, city: true, country: true },
    });
  }

  findEmpreendimento(id: string) {
    return this.prisma.empreendimento.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ownerId: true,
        owner: { select: { id: true, name: true, email: true } },
        agents: {
          select: {
            role: true,
            agent: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  createNotification(data: {
    type: NotificationType;
    scope: NotificationScope;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Prisma.InputJsonValue;
    sourceEntityType?: string;
    sourceEntityId?: string;
    senderAgentId?: string;
    senderCollaboratorId?: string;
    senderSystemLabel?: string;
    recipients: Array<{
      targetType: NotificationTargetType;
      agentId?: string;
      collaboratorId?: string;
      empreendimentoId?: string;
    }>;
  }) {
    return this.prisma.notification.create({
      data: {
        type: data.type,
        scope: data.scope,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
        sourceEntityType: data.sourceEntityType,
        sourceEntityId: data.sourceEntityId,
        senderAgentId: data.senderAgentId,
        senderCollaboratorId: data.senderCollaboratorId,
        senderSystemLabel: data.senderSystemLabel,
        recipients: {
          create: data.recipients,
        },
      },
      include: this.notificationInclude(),
    });
  }

  updateNotification(id: string, data: Prisma.NotificationUpdateInput) {
    return this.prisma.notification.update({
      where: { id },
      data,
      include: this.notificationInclude(),
    });
  }

  findNotification(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
      include: this.notificationInclude(),
    });
  }

  listAgentInbox(agentId: string) {
    return this.prisma.notificationRecipient.findMany({
      where: { agentId },
      include: this.notificationRecipientInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * countAgentUnread totals unread personal and initiative notification recipient rows.
   */
  countAgentUnread(agentId: string, empreendimentoIds: string[]) {
    return this.prisma.notificationRecipient.count({
      where: {
        readAt: null,
        OR: [
          { agentId },
          ...(empreendimentoIds.length > 0
            ? [{ empreendimentoId: { in: empreendimentoIds } }]
            : []),
        ],
      },
    });
  }

  listCollaboratorInbox(collaboratorId: string) {
    return this.prisma.notificationRecipient.findMany({
      where: { collaboratorId },
      include: this.notificationRecipientInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * countCollaboratorUnread totals unread collaborator notification recipient rows.
   */
  countCollaboratorUnread(collaboratorId: string) {
    return this.prisma.notificationRecipient.count({
      where: {
        collaboratorId,
        readAt: null,
      },
    });
  }

  listInitiativeInbox(empreendimentoIds: string[]) {
    return this.prisma.notificationRecipient.findMany({
      where: { empreendimentoId: { in: empreendimentoIds } },
      include: this.notificationRecipientInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  listSentByCollaborator(collaboratorId: string) {
    return this.prisma.notification.findMany({
      where: { senderCollaboratorId: collaboratorId },
      include: this.notificationInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  markRecipientAsRead(recipientId: string) {
    return this.prisma.notificationRecipient.update({
      where: { id: recipientId },
      data: { readAt: new Date() },
      include: this.notificationRecipientInclude(),
    });
  }

  findRecipient(recipientId: string) {
    return this.prisma.notificationRecipient.findUnique({
      where: { id: recipientId },
      include: this.notificationRecipientInclude(),
    });
  }

  createEmailLogs(
    data: Array<{
      notificationId?: string;
      senderCollaboratorId: string;
      targetType: NotificationTargetType;
      agentId?: string;
      empreendimentoId?: string;
      recipientName?: string;
      recipientEmail: string;
      subject: string;
      message: string;
      status: 'PENDING' | 'SENT' | 'FAILED';
      provider?: string;
      errorMessage?: string;
    }>,
  ) {
    return this.prisma.notificationEmailLog.createMany({
      data,
    });
  }

  listEmailHistory(query?: string) {
    return this.prisma.notificationEmailLog.findMany({
      where: query
        ? {
            OR: [
              { recipientEmail: { contains: query, mode: 'insensitive' } },
              { recipientName: { contains: query, mode: 'insensitive' } },
              { subject: { contains: query, mode: 'insensitive' } },
              {
                empreendimento: {
                  name: { contains: query, mode: 'insensitive' },
                },
              },
            ],
          }
        : undefined,
      select: {
        id: true,
        subject: true,
        recipientEmail: true,
        recipientName: true,
        status: true,
        createdAt: true,
        senderCollaborator: { select: { id: true, name: true, email: true } },
        empreendimento: { select: { id: true, name: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  searchRecipients(query?: string) {
    const search = query?.trim();
    return Promise.all([
      this.prisma.agent.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
        take: 15,
      }),
      this.prisma.empreendimento.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        select: { id: true, name: true, category: true, location: true },
        orderBy: { name: 'asc' },
        take: 15,
      }),
    ]);
  }

  listAllAgents() {
    return this.prisma.agent.findMany({
      where: { isActive: true },
      select: { id: true },
    });
  }

  listAllCollaborators() {
    return this.prisma.collaborator.findMany({
      where: { isActive: true },
      select: { id: true },
    });
  }

  private notificationInclude() {
    return {
      senderCollaborator: { select: { id: true, name: true, email: true } },
      senderAgent: { select: { id: true, name: true, email: true } },
      recipients: {
        include: {
          agent: { select: { id: true, name: true, email: true } },
          collaborator: { select: { id: true, name: true, email: true } },
          empreendimento: { select: { id: true, name: true } },
        },
      },
    } satisfies Prisma.NotificationInclude;
  }

  private notificationRecipientInclude() {
    return {
      notification: {
        include: {
          senderCollaborator: { select: { id: true, name: true, email: true } },
          senderAgent: { select: { id: true, name: true, email: true } },
        },
      },
      agent: { select: { id: true, name: true, email: true } },
      collaborator: { select: { id: true, name: true, email: true } },
      empreendimento: { select: { id: true, name: true } },
    } satisfies Prisma.NotificationRecipientInclude;
  }
}
