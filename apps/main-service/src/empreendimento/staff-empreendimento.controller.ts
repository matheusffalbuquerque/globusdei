import { Controller, Patch, Body, Param } from '@nestjs/common';
import { EmpreendimentoService } from './empreendimento.service';
import { FollowUpStatus } from '@prisma/client';

@Controller('staff/empreendimentos')
export class StaffEmpreendimentoController {
  constructor(private readonly empService: EmpreendimentoService) {}

  /**
   * PATCH /staff/empreendimentos/:id/internal
   * Internal staff control for priority, verification and status.
   */
  @Patch(':id/internal')
  async updateInternalControl(
    @Param('id') id: string,
    @Body() payload: { 
      priorityScore?: number; 
      isBankVerified?: boolean; 
      followUpStatus?: FollowUpStatus; 
      internalNotes?: string 
    }
  ) {
    const staffId = 'MOCK_STAFF_ID'; // TODO: Mock staff id from JWT
    return this.empService.updateInternalControl(id, staffId, payload);
  }
}
