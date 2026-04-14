import { Module } from '@nestjs/common';

import { AgentModule } from '../agent/agent.module';
import { CollaboratorModule } from '../collaborator/collaborator.module';
import { OpportunityController } from './opportunity.controller';
import { OpportunityRepository } from './opportunity.repository';
import { OpportunityService } from './opportunity.service';

@Module({
  imports: [AgentModule, CollaboratorModule],
  controllers: [OpportunityController],
  providers: [OpportunityRepository, OpportunityService],
  exports: [OpportunityService],
})
export class OpportunityModule {}
