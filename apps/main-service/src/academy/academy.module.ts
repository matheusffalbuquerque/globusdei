import { Module } from '@nestjs/common';

import { AgentModule } from '../agent/agent.module';
import { CollaboratorModule } from '../collaborator/collaborator.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AcademyController } from './academy.controller';
import { AcademyRepository } from './academy.repository';
import { AcademyService } from './academy.service';

@Module({
  imports: [PrismaModule, AgentModule, CollaboratorModule],
  controllers: [AcademyController],
  providers: [AcademyRepository, AcademyService],
})
export class AcademyModule {}
