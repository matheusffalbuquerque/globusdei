import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import {
  RequireCollaboratorRoles,
  RequireRealmRoles,
} from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { ClaimSlotDto } from './dto/claim-slot.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateSlotDto } from './dto/create-slot.dto';
import { ProvideFeedbackDto } from './dto/provide-feedback.dto';
import { SubmitOnboardingDto } from './dto/submit-onboarding.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@ApiBearerAuth()
@Controller('onboarding')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('questions')
  getQuestions() {
    return this.onboarding.getQuestions();
  }

  @Post('questions')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER)
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.onboarding.createQuestion(dto.title, dto.isRequired ?? true);
  }

  @Patch('questions/:id')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER)
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.onboarding.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER)
  deleteQuestion(@Param('id') id: string) {
    return this.onboarding.deleteQuestion(id);
  }

  @Get('status')
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.onboarding.getStatus(user);
  }

  @Post('submit')
  submit(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitOnboardingDto) {
    return this.onboarding.submitAnswers(user, dto.answers);
  }

  @Get('pending-analysis')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER)
  getPendingAgents() {
    return this.onboarding.getPendingAgents();
  }

  @Post(':agentId/approve')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER)
  approve(
    @Param('agentId') agentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.onboarding.approveQuestionnaire(agentId, user);
  }

  @Get('slots')
  getAvailableSlots() {
    return this.onboarding.getAvailableSlots();
  }

  @Get('collaborator/slots')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER)
  getCollaboratorSlots(@CurrentUser() user: AuthenticatedUser) {
    return this.onboarding.getCollaboratorSlots(user);
  }

  @Post('collaborator/slots')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER)
  createSlot(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSlotDto) {
    return this.onboarding.createSlot(user, dto.startTime, dto.endTime, dto.meetLink);
  }

  @Delete('collaborator/slots/:slotId')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER)
  deleteSlot(@CurrentUser() user: AuthenticatedUser, @Param('slotId') slotId: string) {
    return this.onboarding.deleteSlot(user, slotId);
  }

  @Post('claim-slot')
  claimSlot(@CurrentUser() user: AuthenticatedUser, @Body() dto: ClaimSlotDto) {
    return this.onboarding.claimSlot(user, dto.slotId);
  }

  @Put(':agentId/feedback')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN, CollaboratorRole.PEOPLE_MANAGER)
  provideFeedback(
    @Param('agentId') agentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ProvideFeedbackDto,
  ) {
    return this.onboarding.provideFeedback(agentId, user, dto.feedbackText, dto.approve);
  }
}
