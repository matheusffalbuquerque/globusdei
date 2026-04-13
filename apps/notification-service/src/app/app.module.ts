import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { KeycloakAuthGuard } from './auth/keycloak-auth.guard';
import { PoliciesGuard } from './auth/policies.guard';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { PrismaModule } from './prisma/prisma.module';
import { EmailProvider } from './providers/email.provider';
import { WhatsappProvider } from './providers/whatsapp.provider';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  controllers: [NotificationController],
  providers: [
    EmailProvider,
    WhatsappProvider,
    NotificationRepository,
    NotificationService,
    KeycloakAuthGuard,
    PoliciesGuard,
  ],
})
export class AppModule {}
