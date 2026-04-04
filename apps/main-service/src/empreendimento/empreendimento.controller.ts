import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { EmpreendimentoService } from './empreendimento.service';
import { InviteService } from './invite.service';
import { Prisma, EmpreendimentoAgentRole } from '@prisma/client';

/**
 * Empreendimento Controller
 * Exposes core REST APIs for the main enterprise platform.
 */
@Controller('empreendimentos')
export class EmpreendimentoController {
  constructor(
    private readonly empService: EmpreendimentoService,
    private readonly inviteService: InviteService,
  ) {}

  @Get(':id')
  async getEmpreendimento(@Param('id') id: string) {
    const reqUserId = 'SYSTEM_ADMIN_MOCK'; 
    return this.empService.findOne(id, reqUserId);
  }

  @Post()
  async createEmpreendimento(@Body() data: Prisma.EmpreendimentoCreateInput) {
    // TODO: Extract ownerId from current JWT context
    const ownerId = 'MOCK_AGENT_ID';
    return this.empService.create(data, ownerId);
  }

  @Patch(':id')
  async updateEmpreendimento(@Param('id') id: string, @Body() data: Partial<Prisma.EmpreendimentoUpdateInput>) {
    const actorId = 'MOCK_AGENT_ID';
    return this.empService.update(id, data, actorId);
  }

  /**
   * GET /empreendimentos/:id/bank
   * Secure view of bank details (Only owner or staff)
   */
  @Get(':id/bank')
  async getBankDetails(@Param('id') id: string) {
    return this.empService.viewBankDetails(id);
  }

  /**
   * INVITATION SYSTEM
   */

  @Get('invites/my-invites')
  async getMyInvites(@Query('email') email: string) {
    return this.inviteService.listMyInvites(email);
  }

  @Post('invites/send')
  async sendInvite(
    @Body() payload: { empreendimentoId: string, email: string, role?: EmpreendimentoAgentRole }
  ) {
    const inviterId = 'MOCK_AGENT_ID';
    return this.inviteService.createInvite(
      payload.empreendimentoId,
      inviterId,
      payload.email,
      payload.role || EmpreendimentoAgentRole.CONTRIBUTOR
    );
  }

  @Post('invites/accept')
  async acceptInvite(@Body() payload: { token: string, agentId: string }) {
    return this.inviteService.acceptInvite(payload.token, payload.agentId);
  }
}
