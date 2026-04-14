import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AcademyModule } from '../academy/academy.module';
import { CollaboratorModule } from '../collaborator/collaborator.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { AgentModule } from '../agent/agent.module';
import { EmpreendimentoModule } from '../empreendimento/empreendimento.module';
import { EventModule } from '../event/event.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { OpportunityModule } from '../opportunity/opportunity.module';
import { PlatformModule } from '../platform/platform.module';
import { PrayerRequestModule } from '../prayer-request/prayer-request.module';
import { NotificationModule } from '../notification/notification.module';
import { InvestmentModule } from '../investment/investment.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AgentModule,
    CollaboratorModule,
    EmpreendimentoModule,
    EventModule,
    OnboardingModule,
    OpportunityModule,
    PrayerRequestModule,
    NotificationModule,
    InvestmentModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PlatformModule,
    AcademyModule,
  ],
  controllers: [AppController],
  providers: [AppService, KeycloakAuthGuard, PoliciesGuard],
})
export class AppModule {}
