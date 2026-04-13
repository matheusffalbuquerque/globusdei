import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CollaboratorRole,
  NotificationScope,
  NotificationTargetType,
  NotificationType,
  type Prisma,
} from '@prisma/client';

import type { AuthenticatedUser } from './auth/user-context.interface';
import { NotificationRepository } from './notification.repository';
import { EmailProvider } from './providers/email.provider';
import { CreateNotificationDto, NotificationRecipientDto } from './dto/create-notification.dto';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

/**
 * Implements the platform notification use cases for both UI and internal actors.
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly emailProvider: EmailProvider,
  ) {}

  async listAgentInbox(user: AuthenticatedUser) {
    const agent = await this.notifications.upsertAgentFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });

    return this.notifications.listAgentInbox(agent.id);
  }

  async listAgentInitiativeInbox(user: AuthenticatedUser) {
    const agent = await this.notifications.upsertAgentFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    const initiatives = await this.notifications.listAgentInitiatives(agent.id);

    if (initiatives.length === 0) {
      return [];
    }

    return this.notifications.listInitiativeInbox(initiatives.map((initiative) => initiative.id));
  }

  async listCollaboratorInbox(user: AuthenticatedUser) {
    const collaborator = await this.ensureCollaborator(user);
    return this.notifications.listCollaboratorInbox(collaborator.id);
  }

  async listSentByCollaborator(user: AuthenticatedUser) {
    const collaborator = await this.ensureCollaborator(user);
    return this.notifications.listSentByCollaborator(collaborator.id);
  }

  async sendDirectMessage(user: AuthenticatedUser, dto: SendDirectMessageDto) {
    const collaborator = await this.ensureCollaborator(user);
    const recipients = await this.resolveDirectMessageRecipients(dto);

    return this.notifications.createNotification({
      type: NotificationType.DIRECT_MESSAGE,
      scope:
        dto.targetType === NotificationTargetType.EMPREENDIMENTO
          ? NotificationScope.INITIATIVE
          : NotificationScope.PERSONAL,
      title: dto.title,
      message: dto.message,
      actionUrl: dto.actionUrl,
      senderCollaboratorId: collaborator.id,
      recipients,
    });
  }

  async createNotification(user: AuthenticatedUser, dto: CreateNotificationDto) {
    const senderCollaborator = user.isInternalService ? null : await this.findOptionalCollaborator(user);
    const recipients = await Promise.all(
      dto.recipients.map((recipient) => this.validateRecipient(recipient)),
    );
    const groupedRecipients = await this.resolveRecipientGroups(dto.recipientGroups);

    return this.notifications.createNotification({
      type: dto.type,
      scope: dto.scope ?? NotificationScope.PERSONAL,
      title: dto.title,
      message: dto.message,
      actionUrl: dto.actionUrl,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      sourceEntityType: dto.sourceEntityType,
      sourceEntityId: dto.sourceEntityId,
      senderCollaboratorId: senderCollaborator?.id,
      senderSystemLabel: dto.senderSystemLabel,
      recipients: [...recipients, ...groupedRecipients],
    });
  }

  async updateNotification(user: AuthenticatedUser, notificationId: string, dto: UpdateNotificationDto) {
    const collaborator = await this.ensureCollaborator(user);
    const notification = await this.notifications.findNotification(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (!notification.senderCollaboratorId) {
      throw new ForbiddenException('System notifications cannot be edited.');
    }

    if (notification.senderCollaboratorId !== collaborator.id) {
      throw new ForbiddenException('Only the original collaborator author can edit this notification.');
    }

    return this.notifications.updateNotification(notificationId, {
      title: dto.title,
      message: dto.message,
      actionUrl: dto.actionUrl,
    });
  }

  async markAsRead(user: AuthenticatedUser, recipientId: string) {
    const recipient = await this.notifications.findRecipient(recipientId);
    if (!recipient) {
      throw new NotFoundException('Notification recipient not found.');
    }

    const collaborator = await this.findOptionalCollaborator(user);
    const agent = collaborator
      ? null
      : await this.notifications.upsertAgentFromIdentity({
          authSubject: user.sub,
          email: user.email,
          name: user.name,
        });

    const ownsRecipient =
      recipient.agentId === agent?.id ||
      recipient.collaboratorId === collaborator?.id ||
      (recipient.empreendimentoId &&
        agent &&
        (await this.notifications
          .listAgentInitiatives(agent.id))
          .some((initiative) => initiative.id === recipient.empreendimentoId));

    if (!ownsRecipient) {
      throw new ForbiddenException('You do not have access to this notification.');
    }

    return this.notifications.markRecipientAsRead(recipientId);
  }

  async sendEmail(user: AuthenticatedUser, dto: SendEmailDto) {
    const collaborator = await this.ensureCollaborator(user);
    const recipients = await this.resolveEmailRecipients(dto);

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          await this.emailProvider.send({
            to: recipient.recipientEmail,
            subject: dto.subject,
            message: dto.message,
            metadata: { actorId: collaborator.id, targetType: dto.targetType },
          });

          return {
            ...recipient,
            status: 'SENT' as const,
            provider: 'mock-email-provider',
          };
        } catch (error) {
          return {
            ...recipient,
            status: 'FAILED' as const,
            provider: 'mock-email-provider',
            errorMessage: (error as Error).message,
          };
        }
      }),
    );

    await this.notifications.createEmailLogs(
      results.map((result) => ({
        senderCollaboratorId: collaborator.id,
        targetType: dto.targetType,
        agentId: result.agentId,
        empreendimentoId: result.empreendimentoId,
        recipientName: result.recipientName,
        recipientEmail: result.recipientEmail,
        subject: dto.subject,
        message: dto.message,
        status: result.status,
        provider: result.provider,
        errorMessage: result.errorMessage,
      })),
    );

    return {
      total: results.length,
      sent: results.filter((result) => result.status === 'SENT').length,
      failed: results.filter((result) => result.status === 'FAILED').length,
      recipients: results,
    };
  }

  async listEmailHistory(user: AuthenticatedUser, query?: string) {
    const collaborator = await this.ensureCollaborator(user);
    if (!collaborator.roles.includes(CollaboratorRole.ADMIN)) {
      throw new ForbiddenException('Only administrator collaborators can view the email history.');
    }

    return this.notifications.listEmailHistory(query);
  }

  async searchRecipients(user: AuthenticatedUser, query?: string) {
    await this.ensureMessagingCollaborator(user);
    const [agents, iniciativas] = await this.notifications.searchRecipients(query);
    return { agents, iniciativas };
  }

  private async resolveDirectMessageRecipients(dto: SendDirectMessageDto) {
    if (dto.targetType === NotificationTargetType.AGENT) {
      if (!dto.agentId) {
        throw new BadRequestException('agentId is required for agent notifications.');
      }

      await this.assertAgentExists(dto.agentId);
      return [{ targetType: NotificationTargetType.AGENT, agentId: dto.agentId }];
    }

    if (dto.targetType === NotificationTargetType.EMPREENDIMENTO) {
      if (!dto.empreendimentoId) {
        throw new BadRequestException('empreendimentoId is required for initiative notifications.');
      }

      await this.assertEmpreendimentoExists(dto.empreendimentoId);
      return [
        {
          targetType: NotificationTargetType.EMPREENDIMENTO,
          empreendimentoId: dto.empreendimentoId,
        },
      ];
    }

    throw new BadRequestException('Direct messages support only agent or initiative targets.');
  }

  private async resolveEmailRecipients(dto: SendEmailDto) {
    if (dto.targetType === NotificationTargetType.AGENT) {
      if (!dto.agentId) {
        throw new BadRequestException('agentId is required for emailing an agent.');
      }

      const agent = await this.notifications.findAgent(dto.agentId);
      if (!agent) {
        throw new NotFoundException('Agent not found.');
      }

      return [
        {
          agentId: agent.id,
          recipientName: agent.name,
          recipientEmail: agent.email,
        },
      ];
    }

    if (dto.targetType === NotificationTargetType.EMPREENDIMENTO) {
      if (!dto.empreendimentoId) {
        throw new BadRequestException('empreendimentoId is required for initiative emails.');
      }

      const empreendimento = await this.notifications.findEmpreendimento(dto.empreendimentoId);
      if (!empreendimento) {
        throw new NotFoundException('Empreendimento not found.');
      }

      const recipients = new Map<
        string,
        {
          empreendimentoId: string;
          agentId?: string;
          recipientName?: string;
          recipientEmail: string;
        }
      >();

      recipients.set(empreendimento.owner.email, {
        empreendimentoId: empreendimento.id,
        agentId: empreendimento.owner.id,
        recipientName: empreendimento.owner.name,
        recipientEmail: empreendimento.owner.email,
      });

      empreendimento.agents.forEach((member) => {
        recipients.set(member.agent.email, {
          empreendimentoId: empreendimento.id,
          agentId: member.agent.id,
          recipientName: member.agent.name,
          recipientEmail: member.agent.email,
        });
      });

      return Array.from(recipients.values());
    }

    throw new BadRequestException('Email sending supports only agents or initiatives.');
  }

  private async validateRecipient(recipient: NotificationRecipientDto) {
    switch (recipient.targetType) {
      case NotificationTargetType.AGENT:
        if (!recipient.agentId) {
          throw new BadRequestException('agentId is required for AGENT recipients.');
        }
        await this.assertAgentExists(recipient.agentId);
        return { targetType: recipient.targetType, agentId: recipient.agentId };
      case NotificationTargetType.COLLABORATOR:
        if (!recipient.collaboratorId) {
          throw new BadRequestException('collaboratorId is required for COLLABORATOR recipients.');
        }
        return {
          targetType: recipient.targetType,
          collaboratorId: recipient.collaboratorId,
        };
      case NotificationTargetType.EMPREENDIMENTO:
        if (!recipient.empreendimentoId) {
          throw new BadRequestException('empreendimentoId is required for EMPREENDIMENTO recipients.');
        }
        await this.assertEmpreendimentoExists(recipient.empreendimentoId);
        return {
          targetType: recipient.targetType,
          empreendimentoId: recipient.empreendimentoId,
        };
      default:
        throw new BadRequestException('Unsupported recipient type.');
    }
  }

  private async resolveRecipientGroups(groups?: string[]) {
    if (!groups || groups.length === 0) {
      return [];
    }

    const normalizedGroups = Array.from(new Set(groups.map((group) => group.trim().toUpperCase())));
    const recipients: Array<{
      targetType: NotificationTargetType;
      agentId?: string;
      collaboratorId?: string;
      empreendimentoId?: string;
    }> = [];

    if (normalizedGroups.includes('ALL_AGENTS')) {
      const agents = await this.notifications.listAllAgents();
      recipients.push(
        ...agents.map((agent) => ({
          targetType: NotificationTargetType.AGENT,
          agentId: agent.id,
        })),
      );
    }

    if (normalizedGroups.includes('ALL_COLLABORATORS')) {
      const collaborators = await this.notifications.listAllCollaborators();
      recipients.push(
        ...collaborators.map((collaborator) => ({
          targetType: NotificationTargetType.COLLABORATOR,
          collaboratorId: collaborator.id,
        })),
      );
    }

    return recipients;
  }

  private async assertAgentExists(agentId: string) {
    const agent = await this.notifications.findAgent(agentId);
    if (!agent) {
      throw new NotFoundException('Agent not found.');
    }
    return agent;
  }

  private async assertEmpreendimentoExists(empreendimentoId: string) {
    const empreendimento = await this.notifications.findEmpreendimento(empreendimentoId);
    if (!empreendimento) {
      throw new NotFoundException('Empreendimento not found.');
    }
    return empreendimento;
  }

  private async ensureCollaborator(user: AuthenticatedUser) {
    const collaborator = await this.findOptionalCollaborator(user);

    if (!collaborator) {
      throw new ForbiddenException('Missing local collaborator profile.');
    }

    return collaborator;
  }

  private async ensureMessagingCollaborator(user: AuthenticatedUser) {
    const collaborator = await this.ensureCollaborator(user);
    const canMessage =
      collaborator.roles.includes(CollaboratorRole.ADMIN) ||
      collaborator.roles.includes(CollaboratorRole.PEOPLE_MANAGER) ||
      collaborator.roles.includes(CollaboratorRole.PROJECT_MANAGER) ||
      collaborator.roles.includes(CollaboratorRole.RESOURCE_MANAGER);

    if (!canMessage) {
      throw new ForbiddenException('Collaborator cannot search notification recipients.');
    }

    return collaborator;
  }

  private async findOptionalCollaborator(user: AuthenticatedUser) {
    if (user.isInternalService) {
      return null;
    }

    return this.notifications.findCollaboratorByActor(user.sub, user.email);
  }
}
