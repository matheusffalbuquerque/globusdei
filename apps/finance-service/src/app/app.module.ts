import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { FinanceController } from './finance.controller';
import { FinanceRepository } from './finance.repository';
import { FinanceService } from './finance.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  controllers: [FinanceController],
  providers: [FinanceRepository, FinanceService, KeycloakAuthGuard, PoliciesGuard],
})
export class AppModule {}
