import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestCategory, ServiceRequestStatus } from '@prisma/client';

@Injectable()
export class ServiceRequestService {
  constructor(private prisma: PrismaService) {}

  async createRequest(agentId: string, category: ServiceRequestCategory, description: string) {
    return this.prisma.serviceRequest.create({
      data: {
        agentId,
        category,
        description,
        status: ServiceRequestStatus.OPEN,
      },
    });
  }

  async listForAgent(agentId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForAllStaff() {
    return this.prisma.serviceRequest.findMany({
      include: { agent: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: ServiceRequestStatus, internalNotes?: string, assignedStaffId?: string) {
    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status,
        internalNotes,
        assignedStaffId,
      },
    });
  }
}
