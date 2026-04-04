import { Injectable, BadRequestException, NotFoundException, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditType } from '../audit/audit.service';
import { AgentStatus } from '@prisma/client';

/**
 * OnboardingService — implements the Agent admission state machine.
 *
 * Manages the multi-phase onboarding workflow:
 *  Phase 1 — Agent submits questionnaire answers (ENTERED → SUBMITTED)
 *  Phase 2 — Staff reviews questionnaire and qualifies agent (SUBMITTED → QUALIFIED)
 *  Phase 3 — Agent picks an interview slot (QUALIFIED → SCHEDULED)
 *  Phase 4 — Staff provides final feedback and decision (SCHEDULED → APPROVED | REJECTED)
 *
 * All state transitions are recorded via AuditService for LGPD traceability.
 */
@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    @Inject('NOTIFICATION_SERVICE') private client: ClientProxy,
  ) {}

  /**
   * Phase 1: Submits onboarding questionnaire answers and advances status to SUBMITTED
   */
  async submitAnswers(agentId: string, answers: { questionId: string; text: string }[]) {
    // Check if agent exists
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent profile not resolved.');
    if (agent.status !== AgentStatus.ENTERED) throw new BadRequestException(`Invalid state transition from ${agent.status}`);

    const newAnswers = await this.prisma.$transaction(async (tx) => {
      // 1. Save answers
      for (const ans of answers) {
        await tx.answer.upsert({
          where: { agentId_questionId: { agentId, questionId: ans.questionId } },
          update: { text: ans.text },
          create: { agentId, questionId: ans.questionId, text: ans.text },
        });
      }
      
      // 2. Commit State to SUBMITTED
      return tx.agent.update({
        where: { id: agentId },
        data: { status: AgentStatus.SUBMITTED },
      });
    });

    await this.audit.logAction(agentId, AuditType.TECHNICAL, `Submission of Onboarding Questionnaire payload`);
    return newAnswers;
  }

  /**
   * Staff Utilities: Fetch agents pending analysis and their answers
   */
   async getPendingAgents() {
    return this.prisma.agent.findMany({
      where: {
        status: { in: [AgentStatus.SUBMITTED, AgentStatus.QUALIFIED, AgentStatus.SCHEDULED] }
      },
      include: {
        answers: {
          include: { question: true }
        },
        scheduledSlot: {
          include: { staff: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Phase 2: Staff reviews the questionnaire and moves to QUALIFIED
   */
  async approveQuestionnaire(agentId: string, staffId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent profile not found.');
    if (agent.status !== AgentStatus.SUBMITTED) throw new BadRequestException(`Agent must be in SUBMITTED state, current: ${agent.status}`);

    const updatedAgent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { status: AgentStatus.QUALIFIED },
    });

    await this.audit.logAction(staffId, AuditType.AUDIT, `Approved questionnaire for agent ${agentId}. Status: QUALIFIED.`);
    
    // Emit notification event
    this.client.emit('onboarding_qualified', {
      email: updatedAgent.email,
      name: updatedAgent.name,
    });

    return updatedAgent;
  }

  /**
   * Phase 3: Agent picks an available slot, moving to SCHEDULED
   */
  async claimSlot(agentId: string, slotId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent profile not found.');
    if (agent.status !== AgentStatus.QUALIFIED) throw new BadRequestException(`Agent must be QUALIFIED to claim a slot, current: ${agent.status}`);

    const slot = await this.prisma.availabilitySlot.findUnique({ 
      where: { id: slotId },
      include: { agent: true, staff: true } 
    });
    if (!slot) throw new NotFoundException('Availability slot not found.');
    if (slot.agent) throw new BadRequestException('Slot already claimed.');

    // 1. Update agent status and link the slot
    const updatedAgent = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.SCHEDULED,
        scheduledSlotId: slotId,
        interviewDate: slot.startTime,
        interviewLink: slot.meetLink,
        interviewerId: slot.staffId,
      },
    });

    // Emit notification event
    this.client.emit('onboarding_scheduled', {
      email: updatedAgent.email,
      name: updatedAgent.name,
      date: slot.startTime.toLocaleString('pt-BR'),
      meetLink: slot.meetLink,
    });

    return updatedAgent;
  }

  /**
   * Phase 3: Staff provides post-interview feedback and approval
   */
  async provideFeedback(agentId: string, staffId: string, feedbackText: string, approve: boolean) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent missing.');
    if (agent.status !== AgentStatus.SCHEDULED) throw new BadRequestException(`Action requires SCHEDULED, got ${agent.status}`);

    const outcomeStatus = approve ? AgentStatus.APPROVED : AgentStatus.REJECTED;

    const evaluatedAgent = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        status: outcomeStatus,
        feedback: feedbackText,
      },
    });

    await this.audit.logAction(staffId, AuditType.AUDIT, `Feedback concluded. Result: ${outcomeStatus}`);
    return evaluatedAgent;
  }
}
