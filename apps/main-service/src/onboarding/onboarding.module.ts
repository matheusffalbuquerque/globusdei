import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OnboardingService } from './onboarding.service';
import { QuestionService } from './question.service';
import { OnboardingController } from './onboarding.controller';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

/**
 * OnboardingModule — encapsulates the full Agent admission lifecycle.
 * Registers the OnboardingController, OnboardingService, and QuestionService.
 * Relies on PrismaModule (globally registered) for database access.
 */
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5673'],
          queue: 'notification_queue',
          queueOptions: {
            durable: false
          },
        },
      },
    ]),
  ],
  controllers: [OnboardingController, StaffController],
  providers: [OnboardingService, QuestionService, StaffService],
})
export class OnboardingModule {}
