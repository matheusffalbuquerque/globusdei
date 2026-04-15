import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import {
  OPERATIONAL_COLLABORATOR_REALM_ROLES,
  PLATFORM_REALM_ROLES,
  RequireCollaboratorRoles,
  RequireRealmRoles,
} from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { AskQuestionDto } from './dto/ask-question.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { ReviewWorkDto } from './dto/review-work.dto';
import { SubmitWorkDto } from './dto/submit-work.dto';
import { AcademyService } from './academy.service';

@ApiTags('academy')
@ApiBearerAuth()
@Controller('academy')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles(...PLATFORM_REALM_ROLES)
export class AcademyController {
  constructor(private readonly academy: AcademyService) {}

  // ── Public: Modules list ─────────────────────────────────────────────────────

  /** Lista módulos — agentes veem só publicados; colaborador/admin veem todos */
  @Get('modules')
  listModules(@CurrentUser() user: AuthenticatedUser) {
    const agentOnly = user.realmRoles?.includes('agente') && !user.realmRoles?.includes('administrador');
    return this.academy.listModules(agentOnly);
  }

  /** Lista módulos com aulas (painel admin do colaborador) */
  @Get('modules/admin/full')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  listModulesWithLessons() {
    return this.academy.listModulesWithLessons();
  }

  /** Detalhe de um módulo com grade de aulas */
  @Get('modules/:id')
  getModule(@Param('id') id: string) {
    return this.academy.getModule(id);
  }

  /** Detalhe de uma aula (com materiais e dúvidas) */
  @Get('lessons/:id')
  getLesson(@Param('id') id: string) {
    return this.academy.getLesson(id);
  }

  // ── Admin: CRUD módulos ──────────────────────────────────────────────────────

  @Post('modules')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  createModule(@Body() dto: CreateModuleDto) {
    return this.academy.createModule(dto);
  }

  @Patch('modules/:id')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  updateModule(@Param('id') id: string, @Body() dto: Partial<CreateModuleDto>) {
    return this.academy.updateModule(id, dto);
  }

  // ── Admin: CRUD aulas ────────────────────────────────────────────────────────

  @Post('modules/:moduleId/lessons')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  createLesson(@Param('moduleId') moduleId: string, @Body() dto: CreateLessonDto) {
    return this.academy.createLesson(moduleId, dto);
  }

  @Patch('lessons/:id')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  updateLesson(@Param('id') id: string, @Body() dto: Partial<CreateLessonDto>) {
    return this.academy.updateLesson(id, dto);
  }

  // ── Admin: Materiais ──────────────────────────────────────────────────────────

  @Post('lessons/:lessonId/materials')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  addMaterial(@Param('lessonId') lessonId: string, @Body() dto: CreateMaterialDto) {
    return this.academy.addMaterial(lessonId, dto.title, dto.url);
  }

  @Delete('materials/:id')
  @RequireCollaboratorRoles(CollaboratorRole.ADMIN)
  removeMaterial(@Param('id') id: string) {
    return this.academy.removeMaterial(id);
  }

  // ── Enrollment ─────────────────────────────────────────────────────────────

  @Post('modules/:moduleId/enroll')
  enroll(@CurrentUser() user: AuthenticatedUser, @Param('moduleId') moduleId: string) {
    return this.academy.enroll(user, moduleId);
  }

  // ── Progress ──────────────────────────────────────────────────────────────────

  @Post('lessons/:lessonId/complete')
  markComplete(@CurrentUser() user: AuthenticatedUser, @Param('lessonId') lessonId: string) {
    return this.academy.markLessonComplete(user, lessonId);
  }

  @Get('modules/:moduleId/progress')
  getProgress(@CurrentUser() user: AuthenticatedUser, @Param('moduleId') moduleId: string) {
    return this.academy.getModuleProgress(user, moduleId);
  }

  // ── Questions ─────────────────────────────────────────────────────────────────

  /** Agente: lista dúvidas de uma aula */
  @Get('lessons/:lessonId/questions')
  listLessonQuestions(@Param('lessonId') lessonId: string) {
    return this.academy.listLessonQuestions(lessonId);
  }

  @Post('lessons/:lessonId/questions')
  askQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId') lessonId: string,
    @Body() dto: AskQuestionDto,
  ) {
    return this.academy.askQuestion(user, lessonId, dto.content);
  }

  /** Colaborador: lista dúvidas (all ou só pendentes sem resposta) */
  @Get('questions')
  @RequireRealmRoles(...OPERATIONAL_COLLABORATOR_REALM_ROLES)
  listQuestions(@Query('pending') pending?: string) {
    return this.academy.listAllQuestions(pending === 'true');
  }

  @Post('questions/:questionId/answers')
  @RequireRealmRoles(...OPERATIONAL_COLLABORATOR_REALM_ROLES)
  answerQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('questionId') questionId: string,
    @Body() dto: AnswerQuestionDto,
  ) {
    return this.academy.answerQuestion(user, questionId, dto.content);
  }

  // ── Final Works ───────────────────────────────────────────────────────────────

  @Post('modules/:moduleId/work')
  submitWork(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
    @Body() dto: SubmitWorkDto,
  ) {
    return this.academy.submitWork(user, moduleId, dto.content, dto.fileUrl);
  }

  @Get('modules/:moduleId/work')
  getMyWork(@CurrentUser() user: AuthenticatedUser, @Param('moduleId') moduleId: string) {
    return this.academy.getMyWork(user, moduleId);
  }

  /** Colaborador: lista todos os trabalhos */
  @Get('works')
  @RequireRealmRoles(...OPERATIONAL_COLLABORATOR_REALM_ROLES)
  listWorks(@Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.academy.listAllWorks(status);
  }

  /** Colaborador: avaliar trabalho */
  @Post('works/:workId/review')
  @RequireRealmRoles(...OPERATIONAL_COLLABORATOR_REALM_ROLES)
  reviewWork(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: ReviewWorkDto,
  ) {
    return this.academy.reviewWork(user, workId, dto.feedback, dto.approved);
  }

  // ── Certifications ────────────────────────────────────────────────────────────

  @Get('certifications')
  getMyCertifications(@CurrentUser() user: AuthenticatedUser) {
    return this.academy.listMyCertifications(user);
  }
}
