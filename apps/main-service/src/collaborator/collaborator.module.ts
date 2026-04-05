import { Module } from '@nestjs/common';

import { CollaboratorController } from './collaborator.controller';
import { CollaboratorRepository } from './collaborator.repository';
import { CollaboratorService } from './collaborator.service';

@Module({
  controllers: [CollaboratorController],
  providers: [CollaboratorRepository, CollaboratorService],
  exports: [CollaboratorRepository, CollaboratorService],
})
export class CollaboratorModule {}
