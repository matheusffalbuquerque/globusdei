import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { INotificationProvider, NotificationPayload } from '../interfaces/notification.interface';

/**
 * SMTP-backed email provider used by the notification service.
 */
@Injectable()
export class EmailProvider implements INotificationProvider {
  private readonly logger = new Logger(EmailProvider.name);
  readonly providerName = 'smtp';
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  /**
   * Dispatches the e-mail through the configured SMTP server.
   */
  async send(payload: NotificationPayload): Promise<boolean> {
    const transporter = this.getTransporter();
    const from = payload.from ?? this.getDefaultFrom();

    await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject ?? 'Globus Dei',
      text: payload.message,
      html: payload.html,
    });

    this.logger.log(`SMTP email sent to ${payload.to} with subject "${payload.subject ?? 'Globus Dei'}".`);
    return true;
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const secure = this.parseBoolean(this.config.get<string>('SMTP_SECURE')) || port === 465;

    if (!host || !user || !pass) {
      throw new Error(
        'SMTP is not configured. Define SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    return this.transporter;
  }

  private getDefaultFrom() {
    const fromEmail = this.config.get<string>('MAIL_FROM_ADDRESS') ?? 'comunica@globusdei.org';
    const fromName = this.config.get<string>('MAIL_FROM_NAME') ?? 'Globus Dei';

    return fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
  }

  private parseBoolean(value?: string) {
    return value === 'true' || value === '1' || value === 'yes';
  }
}
