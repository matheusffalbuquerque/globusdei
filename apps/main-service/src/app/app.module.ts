import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AgentModule } from '../agent/agent.module';
import { EmpreendimentoModule } from '../empreendimento/empreendimento.module';
import { EventModule } from '../event/event.module';
import { OnboardingModule } from '../onboarding/onboarding.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AgentModule,
    EmpreendimentoModule,
    EventModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
