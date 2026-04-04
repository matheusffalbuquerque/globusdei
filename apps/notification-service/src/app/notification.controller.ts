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
  async handleDonationProcessed(@Payload() data: Record<string, unknown>) {
    this.logger.log(`Received RabbitMQ event to trigger multi-channel notifications: ${JSON.stringify(data)}`);
    
    // Flow logic: Intelligently dispatch based on provided data keys
    if (data['email']) {
      await this.emailProvider.send({
        to: data['email'] as string,
        subject: 'Thank you for supporting Globus Dei!',
        message: `Your investment/donation of ${data['amount'] ?? 'resources'} was securely processed.`
      });
    }

    if (data['phone']) {
      await this.whatsappProvider.send({
        to: data['phone'] as string,
        message: `GlobusDei Alert: Thank you for your active support! Your transaction of ${data['amount'] ?? 'resources'} was confirmed.`
      });
    }
  }

  /**
   * Onboarding: Triggered when Staff approves questionnaire.
   * Agent should now go to their dashboard to pick a slot.
   */
  @EventPattern('onboarding_qualified')
  async handleOnboardingQualified(@Payload() data: Record<string, unknown>) {
    this.logger.log(`[SIMULATED EMAIL] To: ${data['email']} | Subject: Próximo Passo: Agende sua Entrevista | Message: Olá ${data['name']}, seu questionário foi aprovado! Entre no portal para escolher um horário.`);
  }

  /**
   * Onboarding: Triggered when Agent picks a slot.
   */
  @EventPattern('onboarding_scheduled')
  async handleOnboardingScheduled(@Payload() data: Record<string, unknown>) {
    this.logger.log(`[SIMULATED EMAIL] To: ${data['email']} | Subject: Entrevista Confirmada! | Message: Olá ${data['name']}, sua entrevista está marcada para ${data['date']}. Link: ${data['meetLink']}`);
  }

  /**
   * Empreendimento: Invited Agent notification.
   */
  @EventPattern('onboarding_invite_sent')
  async handleOnboardingInviteSent(@Payload() data: Record<string, unknown>) {
    this.logger.log(`[SIMULATED EMAIL] To: ${data['email']} | Subject: Convite para Iniciativa: ${data['empreendimentoName']} | Message: Você foi convidado para participar do projeto ${data['empreendimentoName']}. Acesse seu painel ou use o token: ${data['token']}`);
    this.logger.log(`[DASHBOARD NOTIFICATION] To: ${data['email']} | Content: Novo convite recebido de ${data['inviterName']}`);
  }
}
