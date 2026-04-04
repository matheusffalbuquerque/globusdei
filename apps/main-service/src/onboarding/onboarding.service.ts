import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditType } from '../audit/audit.service';
import { AgentStatus } from '@prisma/client';

/**
 * OnboardingService — implements the Agent admission state machine.
 *
 * Manages the three-phase onboarding workflow:
 *  Phase 1 — Agent submits questionnaire answers (ENTERED → SUBMITTED)
 *  Phase 2 — Staff schedules a missiological interview (SUBMITTED → SCHEDULED)
 *  Phase 3 — Staff provides final feedback and decision (SCHEDULED → APPROVED | REJECTED)
 *
 * All state transitions are recorded via AuditService for LGPD traceability.
 */
@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
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
        status: { in: [AgentStatus.SUBMITTED, AgentStatus.SCHEDULED] }
      },
      include: {
        answers: {
          include: { question: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Phase 2: Staff Member schedules Google Meet interview
   */
  async scheduleInterview(agentId: string, staffId: string, interviewLink: string, interviewDate: Date) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent missing.');
    if (agent.status !== AgentStatus.SUBMITTED) throw new BadRequestException(`Cannot schedule. Status is ${agent.status}`);

    const scheduledAgent = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.SCHEDULED,
        interviewLink,
        interviewDate,
        interviewerId: staffId,
      },
    });

    await this.audit.logAction(staffId, AuditType.AUDIT, `Scheduled Missiological Profile Interview for Agent ${agentId} via Meet`);
    return scheduledAgent;
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
