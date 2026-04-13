import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationScope,
  NotificationTargetType,
  NotificationType,
} from '@prisma/client';

/**
 * Thin HTTP client used by the main service to register notifications in the notification service.
 */
@Injectable()
export class NotificationGatewayService {
  private readonly logger = new Logger(NotificationGatewayService.name);
  private readonly baseUrl: string;
  private readonly internalToken?: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('NOTIFICATION_SERVICE_URL') ?? 'http://localhost:3004/api';
    this.internalToken = this.config.get<string>('INTERNAL_SERVICE_TOKEN');
  }

  async notify(params: {
    type: NotificationType;
    scope: NotificationScope;
    title: string;
    message: string;
    actionUrl?: string;
    sourceEntityType?: string;
    sourceEntityId?: string;
    senderSystemLabel?: string;
    metadata?: Record<string, unknown>;
    recipientGroups?: string[];
    recipients: Array<{
      targetType: NotificationTargetType;
      agentId?: string;
      collaboratorId?: string;
      empreendimentoId?: string;
    }>;
  }) {
    if (params.recipients.length === 0 && (!params.recipientGroups || params.recipientGroups.length === 0)) {
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/notifications/internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.internalToken
            ? { 'x-internal-service-token': this.internalToken }
            : {}),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(`Notification dispatch failed: ${response.status} ${text}`);
      }
    } catch (error) {
      this.logger.warn(`Notification dispatch failed: ${(error as Error).message}`);
    }
  }
}
