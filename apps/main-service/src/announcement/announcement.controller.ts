import { Controller, Post, Get, Param, Body, UnauthorizedException, Delete } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';

@Controller('api/announcements')
export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  @Post()
  async create(
    @Body() body: { title: string; content: string; type: string; authorId: string; targetId?: string }
  ) {
    // In production, authorId comes from JWT
    return this.announcementService.create(body.title, body.content, body.type, body.authorId, body.targetId);
  }

  @Get()
  async listRecent() {
    return this.announcementService.getRecentForAgent();
  }

  @Get('all')
  async listAll() {
    return this.announcementService.listAll();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.announcementService.delete(id);
  }
}
