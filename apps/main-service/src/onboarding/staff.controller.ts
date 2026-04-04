import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { StaffService } from './staff.service';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  /**
   * GET /staff/:staffId/slots
   * Retrieve all slots for a specific staff member.
   */
  @Get(':staffId/slots')
  async getMySlots(@Param('staffId') staffId: string) {
    return this.staffService.getStaffSlots(staffId);
  }

  /**
   * POST /staff/:staffId/slots
   * Create a new availability slot.
   */
  @Post(':staffId/slots')
  async addSlot(
    @Param('staffId') staffId: string,
    @Body() payload: { startTime: string; endTime: string; meetLink?: string }
  ) {
    return this.staffService.createSlot(
      staffId,
      new Date(payload.startTime),
      new Date(payload.endTime),
      payload.meetLink
    );
  }

  /**
   * DELETE /staff/slots/:slotId
   * Remove an unclaimed slot.
   */
  @Delete('slots/:slotId')
  async removeSlot(@Param('slotId') slotId: string) {
    return this.staffService.deleteSlot(slotId);
  }
}
