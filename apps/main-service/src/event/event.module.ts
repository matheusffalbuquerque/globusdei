import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';

/**
 * Event Module
 */
@Module({
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
