import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CollaboratorRole,
  NotificationScope,
  NotificationTargetType,
  NotificationType,
} from '@prisma/client';

import { CurrentUser } from './auth/current-user.decorator';
import { KeycloakAuthGuard } from './auth/keycloak-auth.guard';
import { PoliciesGuard } from './auth/policies.guard';
import {
  AllowInternalAccess,
  OPERATIONAL_COLLABORATOR_REALM_ROLES,
  PLATFORM_REALM_ROLES,
  RequireCollaboratorRoles,
  RequireRealmRoles,
} from './auth/role.decorators';
import type { AuthenticatedUser } from './auth/user-context.interface';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { SendWelcomeEmailDto } from './dto/send-welcome-email.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationService } from './notification.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailProvider } from './providers/email.provider';
import { WhatsappProvider } from './providers/whatsapp.provider';

/**
 * Exposes the notification center API and keeps compatibility with async event handlers.
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles(...PLATFORM_REALM_ROLES)
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly emailProvider: EmailProvider,
    private readonly whatsappProvider: WhatsappProvider,
  ) {}

  /**
   * Agent inbox with personal notifications.
   */
  @Get('agent')
  @RequireRealmRoles('agente')
  listAgentInbox(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.listAgentInbox(user);
  }

  /**
   * Agent unread count used by portal notification badges.
   */
  @Get('agent/unread-count')
  @RequireRealmRoles('agente')
  countAgentUnread(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.countAgentUnread(user);
  }

  /**
   * Agent inbox with initiative-scoped notifications for owned/member empreendimentos.
   */
  @Get('agent/initiatives')
  @RequireRealmRoles('agente')
  listAgentInitiatives(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.listAgentInitiativeInbox(user);
  }

  /**
   * Collaborator inbox.
   */
  @Get('collaborator')
  @RequireRealmRoles(...OPERATIONAL_COLLABORATOR_REALM_ROLES)
  listCollaboratorInbox(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.listCollaboratorInbox(user);
  }

  /**
   * Collaborator unread count used by portal notification badges.
   */
  @Get('collaborator/unread-count')
  @RequireRealmRoles(...OPERATIONAL_COLLABORATOR_REALM_ROLES)
  countCollaboratorUnread(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.countCollaboratorUnread(user);
  }

  /**
   * Collaborator outbox.
   */
  @Get('collaborator/sent')
  @RequireRealmRoles(...OPERATIONAL_COLLABORATOR_REALM_ROLES)
  listCollaboratorSent(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.listSentByCollaborator(user);
  }

  /**
   * Recipient search used by the collaborator notification composer.
   */
  @Get('collaborator/search')
  @RequireCollaboratorRoles(
    CollaboratorRole.ADMIN,
    CollaboratorRole.PEOPLE_MANAGER,
    CollaboratorRole.PROJECT_MANAGER,
    CollaboratorRole.RESOURCE_MANAGER,
  )
  searchRecipients(
    @CurrentUser() user: AuthenticatedUser,
    @Query('query') query?: string,
  ) {
    return this.notificationService.searchRecipients(user, query);
  }

  /**
   * Collaborator-authored direct in-app notification to an agent or initiative.
   */
  @Post('collaborator/messages')
  @RequireCollaboratorRoles(
    CollaboratorRole.ADMIN,
    CollaboratorRole.PEOPLE_MANAGER,
    CollaboratorRole.PROJECT_MANAGER,
    CollaboratorRole.RESOURCE_MANAGER,
  )
  sendDirectMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendDirectMessageDto,
  ) {
    return this.notificationService.sendDirectMessage(user, dto);
  }

  /**
   * Generic creation route for manual/system notifications.
   */
  @Post()
  @RequireCollaboratorRoles(
    CollaboratorRole.ADMIN,
    CollaboratorRole.PEOPLE_MANAGER,
    CollaboratorRole.PROJECT_MANAGER,
    CollaboratorRole.RESOURCE_MANAGER,
  )
  createNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationService.createNotification(user, dto);
  }

  /**
   * Internal system creation route for service-to-service integrations.
   */
  @Post('internal')
  @AllowInternalAccess()
  createInternalNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationService.createNotification(user, dto);
  }

  @Post('internal/welcome-email')
  @AllowInternalAccess()
  sendInternalWelcomeEmail(@Body() dto: SendWelcomeEmailDto) {
    return this.notificationService.sendWelcomeEmail(dto);
  }

  /**
   * Allows updating previously sent collaborator-authored notifications.
   */
  @Patch(':id')
  @RequireCollaboratorRoles(
    CollaboratorRole.ADMIN,
    CollaboratorRole.PEOPLE_MANAGER,
    CollaboratorRole.PROJECT_MANAGER,
    CollaboratorRole.RESOURCE_MANAGER,
  )
  updateNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationService.updateNotification(user, id, dto);
  }

  /**
   * Marks a notification recipient row as read.
   */
  @Patch('recipients/:id/read')
  markAsRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationService.markAsRead(user, id);
  }

  /**
   * Sends email messages from collaborators to agents or initiatives.
   */
  @Post('emails')
  @RequireCollaboratorRoles(
    CollaboratorRole.ADMIN,
    CollaboratorRole.PEOPLE_MANAGER,
    CollaboratorRole.PROJECT_MANAGER,
    CollaboratorRole.RESOURCE_MANAGER,
  )
  sendEmail(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendEmailDto) {
    if (
      dto.targetType !== NotificationTargetType.AGENT &&
      dto.targetType !== NotificationTargetType.EMPREENDIMENTO
    ) {
      throw new BadRequestException(
        'Email dispatch supports only AGENT or EMPREENDIMENTO targets.',
      );
    }

    return this.notificationService.sendEmail(user, dto);
  }

  /**
   * Email history is restricted to administrator collaborators.
   */
  @Get('emails/history')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  emailHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('query') query?: string,
  ) {
    return this.notificationService.listEmailHistory(user, query);
  }

  /**
   * Backward-compatible event consumer for donation notifications.
   */
  @EventPattern('donation_processed')
  async handleDonationProcessed(@Payload() data: Record<string, unknown>) {
    this.logger.log(
      `Received donation_processed event with payload keys: ${Object.keys(data).join(', ')}`,
    );

    if (typeof data['email'] === 'string') {
      await this.emailProvider.send({
        to: data['email'],
        subject: 'Thank you for supporting Globus Dei!',
        message: `Your investment/donation of ${data['amount'] ?? 'resources'} was securely processed.`,
      });
    }

    if (typeof data['phone'] === 'string') {
      await this.whatsappProvider.send({
        to: data['phone'],
        message: `Globus Dei Alert: your transaction of ${data['amount'] ?? 'resources'} was confirmed.`,
      });
    }
  }

  /**
   * Event consumer for onboarding qualification notifications.
   */
  @EventPattern('onboarding_qualified')
  async handleOnboardingQualified(@Payload() data: Record<string, unknown>) {
    await this.notificationService.createNotification(
      {
        sub: 'internal-service',
        email: 'internal@globusdei.local',
        name: 'Internal Service',
        preferredUsername: 'internal-service',
        realmRoles: ['administrador'],
        isInternalService: true,
      },
      {
        type: NotificationType.PROCESS_UPDATE,
        scope: NotificationScope.PERSONAL,
        title: 'Onboarding qualificado',
        message: `Seu questionário foi aprovado. Você já pode seguir para a próxima etapa.`,
        actionUrl: '/agent/status',
        sourceEntityType: 'onboarding',
        sourceEntityId: String(data['agentId'] ?? ''),
        senderSystemLabel: 'Onboarding',
        recipientGroups: [],
        recipients: data['agentId']
          ? [
              {
                targetType: NotificationTargetType.AGENT,
                agentId: String(data['agentId']),
              },
            ]
          : [],
      },
    );
  }
}
