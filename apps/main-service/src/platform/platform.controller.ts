import { Controller, Post, Get, Param, Body, BadRequestException, Query } from '@nestjs/common';
import { FollowService } from './follow.service';
import { ServiceRequestService } from './service-request.service';
import { ServiceRequestCategory, ServiceRequestStatus } from '@prisma/client';

@Controller('api/platform')
export class PlatformController {
  constructor(
    private followService: FollowService,
    private serviceRequestService: ServiceRequestService
  ) {}

  // FOLLOW INICIATIVAS
  @Post('follow/:empreendimentoId')
  async follow(@Param('empreendimentoId') empreendimentoId: string, @Body() body: { agentId: string }) {
    if (!body.agentId) throw new BadRequestException('Agent ID required.');
    return this.followService.follow(body.agentId, empreendimentoId);
  }

  @Post('unfollow/:empreendimentoId')
  async unfollow(@Param('empreendimentoId') empreendimentoId: string, @Body() body: { agentId: string }) {
    if (!body.agentId) throw new BadRequestException('Agent ID required.');
    return this.followService.unfollow(body.agentId, empreendimentoId);
  }

  @Get('following/:agentId')
  async getFollowing(@Param('agentId') agentId: string) {
    return this.followService.getFollowing(agentId);
  }

  // SERVICE REQUESTS
  @Post('service-request')
  async createRequest(
    @Body() body: { agentId: string; category: ServiceRequestCategory; description: string }
  ) {
    if (!body.agentId || !body.category || !body.description) throw new BadRequestException('Invalid request data.');
    return this.serviceRequestService.createRequest(body.agentId, body.category, body.description);
  }

  @Get('service-requests/:agentId')
  async listForAgent(@Param('agentId') agentId: string) {
    return this.serviceRequestService.listForAgent(agentId);
  }

  // STAFF ONLY (Simulated for now)
  @Get('admin/service-requests')
  async listAllRequests() {
    return this.serviceRequestService.listForAllStaff();
  }

  @Post('admin/service-requests/:id/status')
  async updateRequestStatus(
    @Param('id') id: string,
    @Body() body: { status: ServiceRequestStatus; internalNotes?: string; assignedStaffId?: string }
  ) {
    return this.serviceRequestService.updateStatus(id, body.status, body.internalNotes, body.assignedStaffId);
  }
}
