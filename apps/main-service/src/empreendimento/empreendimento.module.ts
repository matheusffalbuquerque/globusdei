import { Module } from '@nestjs/common';

import { AgentModule } from '../agent/agent.module';
import { CollaboratorModule } from '../collaborator/collaborator.module';
import { EmpreendimentoController } from './empreendimento.controller';
import { EmpreendimentoRepository } from './empreendimento.repository';
import { EmpreendimentoService } from './empreendimento.service';

@Module({
  imports: [AgentModule, CollaboratorModule],
  controllers: [EmpreendimentoController],
  providers: [EmpreendimentoRepository, EmpreendimentoService],
  exports: [EmpreendimentoRepository, EmpreendimentoService],
})
export class EmpreendimentoModule {}
