import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EventService } from './event.service';
import { Prisma } from '@prisma/client';

/**
 * Event Controller
 */
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    const reqUserId = 'SYSTEM_ADMIN_MOCK'; 
    return this.eventService.findOne(id, reqUserId);
  }

  @Post()
  async createEvent(@Body() data: Prisma.EventCreateInput) {
    const reqUserId = 'SYSTEM_ADMIN_MOCK';
    return this.eventService.create(data, reqUserId);
  }
}
