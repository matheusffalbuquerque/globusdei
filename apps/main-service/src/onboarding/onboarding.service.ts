import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentStatus, CollaboratorRole } from '@prisma/client';

import { AgentRepository } from '../agent/agent.repository';
import { AuditService, AuditType } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CollaboratorRepository } from '../collaborator/collaborator.repository';
import { OnboardingRepository } from './onboarding.repository';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly onboarding: OnboardingRepository,
    private readonly agents: AgentRepository,
    private readonly collaborators: CollaboratorRepository,
    private readonly audit: AuditService,
  ) {}

  getQuestions() {
    return this.onboarding.findQuestions();
  }

  createQuestion(title: string, isRequired = true) {
    return this.onboarding.createQuestion(title, isRequired);
  }

  updateQuestion(id: string, data: { title?: string; isRequired?: boolean }) {
    return this.onboarding.updateQuestion(id, data);
  }

  async deleteQuestion(id: string) {
    const deleted = await this.onboarding.deleteQuestion(id);
    if (!deleted) {
      throw new NotFoundException('Question not found.');
    }
    return deleted;
  }

  async submitAnswers(user: AuthenticatedUser, answers: { questionId: string; text: string }[]) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    const currentAgent = await this.onboarding.findAgentById(agent.id);

    if (!currentAgent) {
      throw new NotFoundException('Agent not found.');
    }

    if (
      currentAgent.status !== AgentStatus.ENTERED &&
      currentAgent.status !== AgentStatus.REJECTED
    ) {
      throw new BadRequestException(`Invalid onboarding state ${currentAgent.status}.`);
    }

    const requiredQuestions = (await this.onboarding.findQuestions()).filter((question) => question.isRequired);
    const provided = new Map(answers.map((answer) => [answer.questionId, answer.text.trim()]));
    const missing = requiredQuestions.filter((question) => !provided.get(question.id));

    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required answers for: ${missing.map((question) => question.title).join(', ')}`,
      );
    }

    const submitted = await this.onboarding.submitAnswers(agent.id, answers);
    await this.audit.logAction(agent.id, AuditType.TECHNICAL, 'Submissão do onboarding.');
    return submitted;
  }

  async getStatus(user: AuthenticatedUser) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });

    return this.onboarding.findAgentById(agent.id);
  }

  getPendingAgents() {
    return this.onboarding.findPendingAgents();
  }

  async approveQuestionnaire(agentId: string, user: AuthenticatedUser) {
    const collaborator = await this.ensurePeopleManager(user);
    const agent = await this.onboarding.findAgentById(agentId);

    if (!agent) {
      throw new NotFoundException('Agent not found.');
    }

    if (agent.status !== AgentStatus.SUBMITTED) {
      throw new BadRequestException('Agent must be SUBMITTED before approval.');
    }

    const updated = await this.onboarding.approveQuestionnaire(agentId);
    await this.audit.logAction(
      collaborator.id,
      AuditType.AUDIT,
      `Aprovação do questionário do agente ${agentId}.`,
    );
    return updated;
  }

  getAvailableSlots() {
    return this.onboarding.findAvailableSlots();
  }

  async getCollaboratorSlots(user: AuthenticatedUser) {
    const collaborator = await this.ensurePeopleManager(user);
    return this.onboarding.findCollaboratorSlots(collaborator.id);
  }

  async createSlot(
    user: AuthenticatedUser,
    startTime: string,
    endTime: string,
    meetLink?: string,
  ) {
    const collaborator = await this.ensurePeopleManager(user);
    return this.onboarding.createSlot(
      collaborator.id,
      new Date(startTime),
      new Date(endTime),
      meetLink,
    );
  }

  async deleteSlot(user: AuthenticatedUser, slotId: string) {
    await this.ensurePeopleManager(user);
    const deleted = await this.onboarding.deleteSlot(slotId);

    if (!deleted) {
      throw new NotFoundException('Slot not found.');
    }

    return deleted;
  }

  async claimSlot(user: AuthenticatedUser, slotId: string) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
    const agentStatus = await this.onboarding.findAgentById(agent.id);

    if (!agentStatus) {
      throw new NotFoundException('Agent not found.');
    }

    if (agentStatus.status !== AgentStatus.QUALIFIED) {
      throw new BadRequestException('Agent must be QUALIFIED before claiming a slot.');
    }

    const claimed = await this.onboarding.claimSlot(agent.id, slotId);
    if (!claimed) {
      throw new NotFoundException('Slot not found.');
    }

    await this.audit.logAction(agent.id, AuditType.TECHNICAL, `Agendamento do slot ${slotId}.`);
    return claimed;
  }

  async provideFeedback(
    agentId: string,
    user: AuthenticatedUser,
    feedbackText: string,
    approve: boolean,
  ) {
    const collaborator = await this.ensurePeopleManager(user);
    const agent = await this.onboarding.findAgentById(agentId);

    if (!agent) {
      throw new NotFoundException('Agent not found.');
    }

    if (agent.status !== AgentStatus.SCHEDULED) {
      throw new BadRequestException('Agent must be SCHEDULED before feedback.');
    }

    const updated = await this.onboarding.provideFeedback(agentId, approve, feedbackText);
    await this.audit.logAction(
      collaborator.id,
      AuditType.AUDIT,
      `Feedback do onboarding do agente ${agentId}.`,
    );
    return updated;
  }

  private async ensurePeopleManager(user: AuthenticatedUser) {
    const collaborator = await this.collaborators.findBySubjectOrEmail(user.sub, user.email);

    if (!collaborator) {
      throw new ForbiddenException('Local collaborator profile not found.');
    }

    const allowed =
      collaborator.roles.includes(CollaboratorRole.ADMIN) ||
      collaborator.roles.includes(CollaboratorRole.PEOPLE_MANAGER);

    if (!allowed) {
      throw new ForbiddenException('Collaborator cannot manage onboarding.');
    }

    return collaborator;
  }
}
