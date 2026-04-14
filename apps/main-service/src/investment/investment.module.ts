import { Module } from '@nestjs/common';

import { AgentModule } from '../agent/agent.module';
import { CollaboratorModule } from '../collaborator/collaborator.module';
import { InvestmentController } from './investment.controller';
import { InvestmentRepository } from './investment.repository';
import { InvestmentService } from './investment.service';

@Module({
  imports: [AgentModule, CollaboratorModule],
  controllers: [InvestmentController],
  providers: [InvestmentRepository, InvestmentService],
  exports: [InvestmentService],
})
export class InvestmentModule {}
