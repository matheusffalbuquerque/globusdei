import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { QuestionService } from './question.service';
import { StaffService } from './staff.service';
import { Prisma } from '@prisma/client';

/**
 * OnboardingController — HTTP gateway for the Agent admission lifecycle.
 *
 * Exposes three public-facing phases:
 *  1. Agent submits the onboarding questionnaire (POST :agentId/submit)
 *  2. Staff schedules a Google Meet interview    (PUT  :agentId/schedule)
 *  3. Staff provides post-interview feedback      (PUT  :agentId/feedback)
 *
 * Also exposes read-only endpoints for listing questions and pending Agents.
 *
 * @note Authentication/authorisation via Keycloak OIDC is pending integration.
 *       The staffId is temporarily mocked — see TODO comments below.
 */
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly onboarding: OnboardingService,
    private readonly questions: QuestionService,
    private readonly staff: StaffService,
  ) {}

  /**
   * GET /onboarding/questions
   * Returns all active onboarding questions for the Agent-facing questionnaire form.
   */
  @Get('questions')
  async getQuestions() {
    return this.questions.findAll();
  }

  /**
   * GET /onboarding/pending-analysis
   * Staff utility: retrieves all Agents with status SUBMITTED or SCHEDULED,
   * including their questionnaire answers, for missiological review.
   */
  @Get('pending-analysis')
  async extractPendingAgents() {
    return this.onboarding.getPendingAgents();
  }

  /**
   * GET /onboarding/slots
   * Agent utility: retrieves all available (unclaimed) interview slots.
   */
  @Get('slots')
  async getAvailableSlots() {
    return this.staff.getAvailableSlots();
  }

  /**
   * POST /onboarding/questions
   * Admin endpoint: creates a new onboarding question in the catalogue.
   * @param data - Question payload (title, isRequired).
   */
  @Post('questions')
  async addQuestion(@Body() data: Prisma.QuestionCreateInput) {
    return this.questions.create(data);
  }

  /**
   * POST /onboarding/:agentId/submit
   * Agent submits questionnaire answers — transitions status from ENTERED → SUBMITTED.
   * @param agentId - UUID of the Agent submitting the form.
   * @param payload - Object containing an array of { questionId, text } answer pairs.
   */
  @Post(':agentId/submit')
  async submitForm(
    @Param('agentId') agentId: string,
    @Body() payload: { answers: { questionId: string; text: string }[] }
  ) {
    return this.onboarding.submitAnswers(agentId, payload.answers);
  }

  /**
   * PATCH /onboarding/:agentId/approve
   * Staff approves questionnaire for a SUBMITTED agent (→ QUALIFIED).
   * Indicating the agent is now ready to pick an interview slot.
   */
  @Post(':agentId/approve')
  async approveQuestionnaire(
    @Param('agentId') agentId: string,
  ) {
    // TODO: Extract staffId from Keycloak JWT token
    const staffId = 'STAFF_MOCK_UUID';
    return this.onboarding.approveQuestionnaire(agentId, staffId);
  }

  /**
   * POST /onboarding/:agentId/claim-slot
   * Agent picks an available interview slot (QUALIFIED → SCHEDULED).
   */
  @Post(':agentId/claim-slot')
  async claimInterviewSlot(
    @Param('agentId') agentId: string,
    @Body() payload: { slotId: string }
  ) {
    return this.onboarding.claimSlot(agentId, payload.slotId);
  }

  /**
   * PUT /onboarding/:agentId/feedback
   * Staff provides missiological feedback and approves or rejects the Agent (→ APPROVED | REJECTED).
   * @param agentId - UUID of the Agent being evaluated.
   * @param payload - feedbackText string and boolean approve flag.
   *
   * TODO: Same LGPD concern as scheduleInterview — staffId must come from the JWT token.
   */
  @Put(':agentId/feedback')
  async emitFeedback(
    @Param('agentId') agentId: string,
    @Body() payload: { feedbackText: string; approve: boolean }
  ) {
    // TODO: Extract staffId from Keycloak JWT token (request context)
    const staffId = 'STAFF_MOCK_UUID';
    return this.onboarding.provideFeedback(
      agentId,
      staffId,
      payload.feedbackText,
      payload.approve,
    );
  }
}
