import { Module } from '@nestjs/common';

import { AgentController, PublicAgentController } from './agent.controller';
import { AgentRepository } from './agent.repository';
import { AgentService } from './agent.service';

@Module({
  controllers: [PublicAgentController, AgentController],
  providers: [AgentRepository, AgentService],
  exports: [AgentRepository, AgentService],
})
export class AgentModule {}
