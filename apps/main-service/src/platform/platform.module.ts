import { Module } from '@nestjs/common';

import { AgentModule } from '../agent/agent.module';
import { AnnouncementController } from '../announcement/announcement.controller';
import { AnnouncementRepository } from '../announcement/announcement.repository';
import { AnnouncementService } from '../announcement/announcement.service';
import { CollaboratorModule } from '../collaborator/collaborator.module';
import { ConnectionController } from '../connection/connection.controller';
import { ConnectionRepository } from '../connection/connection.repository';
import { ConnectionService } from '../connection/connection.service';
import { PlatformController } from './platform.controller';
import { PlatformRepository } from './platform.repository';
import { FollowService } from './follow.service';
import { ServiceRequestService } from './service-request.service';

@Module({
  imports: [AgentModule, CollaboratorModule],
  controllers: [AnnouncementController, ConnectionController, PlatformController],
  providers: [
    AnnouncementRepository,
    AnnouncementService,
    ConnectionRepository,
    ConnectionService,
    PlatformRepository,
    FollowService,
    ServiceRequestService,
  ],
  exports: [PlatformRepository, FollowService, ServiceRequestService],
})
export class PlatformModule {}
