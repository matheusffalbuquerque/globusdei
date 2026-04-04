import { Module } from '@nestjs/common';
import { EmpreendimentoService } from './empreendimento.service';
import { EmpreendimentoController } from './empreendimento.controller';
import { StaffEmpreendimentoController } from './staff-empreendimento.controller';
import { InviteService } from './invite.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

/**
 * Empreendimento Module
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
  controllers: [EmpreendimentoController, StaffEmpreendimentoController],
  providers: [EmpreendimentoService, InviteService],
})
export class EmpreendimentoModule {}
