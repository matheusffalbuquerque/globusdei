import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';

/**
 * Agent Module
 * Encapsulates the Domain operations for the Globus Dei missionary agents.
 */
@Module({
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
