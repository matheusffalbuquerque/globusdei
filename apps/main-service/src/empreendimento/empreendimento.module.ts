import { Module } from '@nestjs/common';
import { EmpreendimentoService } from './empreendimento.service';
import { EmpreendimentoController } from './empreendimento.controller';

/**
 * Empreendimento Module
 */
@Module({
  controllers: [EmpreendimentoController],
  providers: [EmpreendimentoService],
})
export class EmpreendimentoModule {}
