import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new availability slot
   */
  async createSlot(staffId: string, startTime: Date, endTime: Date, meetLink?: string) {
    return this.prisma.availabilitySlot.create({
      data: {
        staffId,
        startTime,
        endTime,
        meetLink,
      },
    });
  }

  /**
   * List slots for a specific staff member
   */
  async getStaffSlots(staffId: string) {
    return this.prisma.availabilitySlot.findMany({
      where: { staffId },
      include: { agent: true },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Delete a slot if not claimed
   */
  async deleteSlot(slotId: string) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { agent: true },
    });

    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.agent) throw new Error('Cannot delete a claimed slot');

    return this.prisma.availabilitySlot.delete({ where: { id: slotId } });
  }

  /**
   * List all available (unclaimed) slots for agents to choose
   */
  async getAvailableSlots() {
    return this.prisma.availabilitySlot.findMany({
      where: { agent: { is: null } },
      include: { staff: true },
      orderBy: { startTime: 'asc' },
    });
  }
}
