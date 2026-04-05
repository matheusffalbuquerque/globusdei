import { Module } from '@nestjs/common';

import { AgentModule } from '../agent/agent.module';
import { CollaboratorModule } from '../collaborator/collaborator.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingRepository } from './onboarding.repository';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [AgentModule, CollaboratorModule],
  controllers: [OnboardingController],
  providers: [OnboardingRepository, OnboardingService],
  exports: [OnboardingRepository, OnboardingService],
})
export class OnboardingModule {}
