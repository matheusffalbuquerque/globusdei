import { Injectable } from '@nestjs/common';
import { AgentStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OnboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findQuestions() {
    return this.prisma.question.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  createQuestion(title: string, isRequired: boolean) {
    return this.prisma.question.create({
      data: { title, isRequired },
    });
  }

  updateQuestion(id: string, data: { title?: string; isRequired?: boolean }) {
    return this.prisma.question.update({
      where: { id },
      data,
    });
  }

  async deleteQuestion(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) return null;
    return this.prisma.question.delete({ where: { id } });
  }

  findAgentById(agentId: string) {
    return this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        answers: true,
        scheduledSlot: true,
      },
    });
  }

  findPendingAgents() {
    return this.prisma.agent.findMany({
      where: {
        status: { in: [AgentStatus.SUBMITTED, AgentStatus.QUALIFIED, AgentStatus.SCHEDULED] },
      },
      include: {
        answers: {
          include: { question: true },
        },
        scheduledSlot: {
          include: { collaborator: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findAvailableSlots() {
    return this.prisma.availabilitySlot.findMany({
      where: { agent: { is: null } },
      include: { collaborator: true },
      orderBy: { startTime: 'asc' },
    });
  }

  findCollaboratorSlots(collaboratorId: string) {
    return this.prisma.availabilitySlot.findMany({
      where: { collaboratorId },
      include: { agent: true },
      orderBy: { startTime: 'asc' },
    });
  }

  createSlot(collaboratorId: string, startTime: Date, endTime: Date, meetLink?: string) {
    return this.prisma.availabilitySlot.create({
      data: {
        collaboratorId,
        startTime,
        endTime,
        meetLink,
      },
    });
  }

  async deleteSlot(slotId: string) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { agent: true },
    });

    if (!slot) {
      return null;
    }

    if (slot.agent) {
      throw new Error('Claimed slots cannot be deleted.');
    }

    return this.prisma.availabilitySlot.delete({ where: { id: slotId } });
  }

  async submitAnswers(agentId: string, answers: { questionId: string; text: string }[]) {
    return this.prisma.$transaction(async (tx) => {
      for (const answer of answers) {
        await tx.answer.upsert({
          where: {
            agentId_questionId: {
              agentId,
              questionId: answer.questionId,
            },
          },
          update: { text: answer.text },
          create: {
            agentId,
            questionId: answer.questionId,
            text: answer.text,
          },
        });
      }

      return tx.agent.update({
        where: { id: agentId },
        data: { status: AgentStatus.SUBMITTED },
      });
    });
  }

  approveQuestionnaire(agentId: string) {
    return this.prisma.agent.update({
      where: { id: agentId },
      data: { status: AgentStatus.QUALIFIED },
    });
  }

  async claimSlot(agentId: string, slotId: string) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { agent: true, collaborator: true },
    });

    if (!slot) {
      return null;
    }

    if (slot.agent) {
      throw new Error('Slot already claimed.');
    }

    return this.prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.SCHEDULED,
        scheduledSlotId: slotId,
        interviewDate: slot.startTime,
        interviewLink: slot.meetLink,
        interviewerId: slot.collaboratorId,
      },
    });
  }

  provideFeedback(agentId: string, approve: boolean, feedbackText: string) {
    return this.prisma.agent.update({
      where: { id: agentId },
      data: {
        status: approve ? AgentStatus.APPROVED : AgentStatus.REJECTED,
        feedback: feedbackText,
      },
    });
  }
}
