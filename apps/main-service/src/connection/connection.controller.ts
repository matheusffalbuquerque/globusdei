import { Controller, Post, Get, Param, Body, BadRequestException } from '@nestjs/common';
import { ConnectionService } from './connection.service';

@Controller('api/connections')
export class ConnectionController {
  constructor(private connectionService: ConnectionService) {}

  @Post('request')
  async request(@Body() body: { senderId: string; receiverId: string }) {
    if (!body.senderId || !body.receiverId) throw new BadRequestException('Invalid data.');
    return this.connectionService.sendRequest(body.senderId, body.receiverId);
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string, @Body() body: { actorId: string }) {
    return this.connectionService.acceptRequest(body.actorId, id);
  }

  @Get(':agentId')
  async getConnections(@Param('agentId') agentId: string) {
    return this.connectionService.listConnections(agentId);
  }

  @Get(':agentId/pending')
  async getPending(@Param('agentId') agentId: string) {
    return this.connectionService.listPending(agentId);
  }
}
