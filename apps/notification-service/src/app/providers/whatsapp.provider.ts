import { Injectable, Logger } from '@nestjs/common';
import { INotificationProvider, NotificationPayload } from '../interfaces/notification.interface';

/**
 * WhatsApp Integration Provider.
 * Structured to hook directly into Twilio or WhatsApp Cloud API once secrets are configured.
 */
@Injectable()
export class WhatsappProvider implements INotificationProvider {
  private readonly logger = new Logger(WhatsappProvider.name);

  /**
   * Mocks the dispatch of a WhatsApp Message over Meta Graph API.
   * Replaced logically once the integration keys are pushed to environment variables.
   */
  async send(payload: NotificationPayload): Promise<boolean> {
    this.logger.log(`[MOCK WHATSAPP API] Targeting WhatsApp number: ${payload.to}`);
    this.logger.log(`[MOCK WHATSAPP API] Message payload: ${payload.message}`);
    
    // Simulate network latency for the Meta Graph API call
    await new Promise(resolve => setTimeout(resolve, 400));
    this.logger.log(`[MOCK WHATSAPP API] Message sent with success code.`);

    return true;
  }
}
