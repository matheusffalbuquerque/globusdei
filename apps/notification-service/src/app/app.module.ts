import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { EmailProvider } from './providers/email.provider';
import { WhatsappProvider } from './providers/whatsapp.provider';

@Module({
  imports: [],
  controllers: [NotificationController],
  providers: [EmailProvider, WhatsappProvider],
})
export class AppModule {}
