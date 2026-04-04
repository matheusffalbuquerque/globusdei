import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { QuestionService } from './question.service';
import { OnboardingController } from './onboarding.controller';

/**
 * OnboardingModule — encapsulates the full Agent admission lifecycle.
 * Registers the OnboardingController, OnboardingService, and QuestionService.
 * Relies on PrismaModule (globally registered) for database access.
 */
@Module({
  controllers: [OnboardingController],
  providers: [OnboardingService, QuestionService],
})
export class OnboardingModule {}
