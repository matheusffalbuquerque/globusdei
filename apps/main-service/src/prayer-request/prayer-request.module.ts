import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { PrayerRequestController } from './prayer-request.controller';
import { PrayerRequestRepository } from './prayer-request.repository';
import { PrayerRequestService } from './prayer-request.service';

@Module({
  imports: [PrismaModule],
  controllers: [PrayerRequestController],
  providers: [PrayerRequestRepository, PrayerRequestService],
})
export class PrayerRequestModule {}
