import { Module } from '@nestjs/common';
import { ConnectionService } from '../connection/connection.service';
import { ConnectionController } from '../connection/connection.controller';
import { AnnouncementService } from '../announcement/announcement.service';
import { AnnouncementController } from '../announcement/announcement.controller';
import { FollowService } from './follow.service';
import { ServiceRequestService } from './service-request.service';
import { PlatformController } from './platform.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ConnectionController,
    AnnouncementController,
    PlatformController,
  ],
  providers: [
    ConnectionService,
    AnnouncementService,
    FollowService,
    ServiceRequestService,
  ],
  exports: [
    ConnectionService,
    AnnouncementService,
    FollowService,
    ServiceRequestService,
  ],
})
export class PlatformModule {}
