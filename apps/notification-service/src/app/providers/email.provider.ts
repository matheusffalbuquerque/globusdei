import { Injectable, Logger } from '@nestjs/common';
import { INotificationProvider, NotificationPayload } from '../interfaces/notification.interface';

/**
 * Email Integration Provider.
 * Structured to immediately hook into AWS SES, SendGrid, or Nodemailer when the API keys are injected.
 */
@Injectable()
export class EmailProvider implements INotificationProvider {
  private readonly logger = new Logger(EmailProvider.name);

  /**
   * Mocks the dispatch of an Email to the client.
   * Will be swapped with actual SMTP/API logic upon API credentials initialization.
   */
  async send(payload: NotificationPayload): Promise<boolean> {
    this.logger.log(`[MOCK EMAIL API] Attempting send to: ${payload.to} | Subject: ${payload.subject}`);
    this.logger.log(`[MOCK EMAIL API] Content body: ${payload.message}`);
    
    // Simulate network latency for API call to an external provider
    await new Promise(resolve => setTimeout(resolve, 300));
    this.logger.log(`[MOCK EMAIL API] Successfully delivered.`);
    
    return true;
  }
}
