import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailProvider } from './providers/email.provider';
import { WhatsappProvider } from './providers/whatsapp.provider';

/**
 * Controller dynamically responsible for consuming raw events from the 
 * RabbitMQ Message Broker. Decouples notification mechanisms from core business logic.
 */
@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  /**
   * Injects the notification strategy providers.
   */
  constructor(
    private readonly emailProvider: EmailProvider,
    private readonly whatsappProvider: WhatsappProvider
  ) {}

  /**
   * Listens for asynchronous domain events broadcasted via RabbitMQ.
   * Following DDD boundaries, when FinanceService successfully clears a transaction, 
   * this controller catches the event asynchronously to trigger independent channel alerts.
   * 
   * @param data The JSON payload containing investment details, amount, and target channels.
   */
  @EventPattern('donation_processed')
  async handleDonationProcessed(@Payload() data: Record<string, any>) {
    this.logger.log(`Received RabbitMQ event to trigger multi-channel notifications: ${JSON.stringify(data)}`);
    
    // Flow logic: Intelligently dispatch based on provided data keys
    if (data['email']) {
      await this.emailProvider.send({
        to: data['email'],
        subject: 'Thank you for supporting Globus Dei!',
        message: `Your investment/donation of ${data['amount'] ?? 'resources'} was securely processed.`
      });
    }

    if (data['phone']) {
      await this.whatsappProvider.send({
        to: data['phone'],
        message: `GlobusDei Alert: Thank you for your active support! Your transaction of ${data['amount'] ?? 'resources'} was confirmed.`
      });
    }
  }
}
