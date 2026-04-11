import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AgentRepository } from '../agent/agent.repository';
import { CollaboratorRepository } from '../collaborator/collaborator.repository';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { AcademyRepository } from './academy.repository';

type FinalWorkStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Injectable()
export class AcademyService {
  constructor(
    private readonly academy: AcademyRepository,
    private readonly agents: AgentRepository,
    private readonly collaborators: CollaboratorRepository,
  ) {}

  private async resolveAgent(user: AuthenticatedUser) {
    return this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
  }

  private async resolveCollaborator(user: AuthenticatedUser) {
    const collab = await this.collaborators.findBySubjectOrEmail(user.sub, user.email);
    if (!collab) throw new NotFoundException('Collaborator not found.');
    return collab;
  }

  // ── Modules (admin) ─────────────────────────────────────────────────────────

  createModule(data: {
    title: string; description: string; coverUrl?: string;
    isPublished?: boolean; order?: number;
  }) {
    return this.academy.createModule(data);
  }

  updateModule(id: string, data: Partial<{
    title: string; description: string; coverUrl: string;
    isPublished: boolean; order: number;
  }>) {
    return this.academy.updateModule(id, data);
  }

  /** Lista módulos publicados para agentes; todos para admin/colaborador */
  listModules(publishedOnly: boolean) {
    return this.academy.listModules(publishedOnly);
  }

  async getModule(id: string) {
    const mod = await this.academy.findModule(id);
    if (!mod) throw new NotFoundException('Module not found.');
    return mod;
  }

  // ── Lessons (admin) ──────────────────────────────────────────────────────────

  async createLesson(moduleId: string, data: {
    title: string; description: string; youtubeUrl?: string; order?: number;
  }) {
    const mod = await this.academy.findModule(moduleId);
    if (!mod) throw new NotFoundException('Module not found.');
    return this.academy.createLesson(moduleId, data);
  }

  updateLesson(id: string, data: Partial<{
    title: string; description: string; youtubeUrl: string; order: number;
  }>) {
    return this.academy.updateLesson(id, data);
  }

  async getLesson(lessonId: string) {
    const lesson = await this.academy.findLesson(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found.');
    return lesson;
  }

  // ── Materials ─────────────────────────────────────────────────────────────────

  addMaterial(lessonId: string, title: string, url: string) {
    return this.academy.addMaterial(lessonId, title, url);
  }

  removeMaterial(materialId: string) {
    return this.academy.removeMaterial(materialId);
  }

  // ── Enrollment ─────────────────────────────────────────────────────────────

  async enroll(user: AuthenticatedUser, moduleId: string) {
    const mod = await this.academy.findModule(moduleId);
    if (!mod) throw new NotFoundException('Module not found.');
    if (!mod.isPublished) throw new ForbiddenException('Module is not published.');
    const agent = await this.resolveAgent(user);
    return this.academy.enroll(agent.id, moduleId);
  }

  // ── Progress ──────────────────────────────────────────────────────────────────

  async markLessonComplete(user: AuthenticatedUser, lessonId: string) {
    const agent = await this.resolveAgent(user);
    const lesson = await this.academy.findLesson(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found.');
    return this.academy.markComplete(lessonId, agent.id);
  }

  async getModuleProgress(user: AuthenticatedUser, moduleId: string) {
    const agent = await this.resolveAgent(user);
    const [completed, total] = await Promise.all([
      this.academy.listCompletedLessonIds(agent.id, moduleId),
      this.academy.countLessonsInModule(moduleId),
    ]);
    return {
      completedIds: completed.map((c: { lessonId: string }) => c.lessonId),
      total,
      completed: completed.length,
      allDone: completed.length >= total && total > 0,
    };
  }

  // ── Questions ─────────────────────────────────────────────────────────────────

  async askQuestion(user: AuthenticatedUser, lessonId: string, content: string) {
    const agent = await this.resolveAgent(user);
    return this.academy.createQuestion(lessonId, agent.id, content);
  }

  listAllQuestions(pendingOnly: boolean) {
    return pendingOnly
      ? this.academy.listAllPendingQuestions()
      : this.academy.listAllQuestions();
  }

  async answerQuestion(user: AuthenticatedUser, questionId: string, content: string) {
    const collab = await this.resolveCollaborator(user);
    return this.academy.answerQuestion(questionId, collab.id, content);
  }

  // ── Final Works ───────────────────────────────────────────────────────────────

  async submitWork(user: AuthenticatedUser, moduleId: string, content?: string, fileUrl?: string) {
    if (!content && !fileUrl) {
      throw new BadRequestException('Provide at least content or fileUrl.');
    }
    const agent = await this.resolveAgent(user);

    // Validate all lessons completed before submitting
    const [completed, total] = await Promise.all([
      this.academy.listCompletedLessonIds(agent.id, moduleId),
      this.academy.countLessonsInModule(moduleId),
    ]);
    if (total > 0 && completed.length < total) {
      throw new ForbiddenException('Complete all lessons before submitting the final work.');
    }

    return this.academy.submitWork(moduleId, agent.id, content, fileUrl);
  }

  async getMyWork(user: AuthenticatedUser, moduleId: string) {
    const agent = await this.resolveAgent(user);
    return this.academy.findWork(moduleId, agent.id);
  }

  listAllWorks(status?: FinalWorkStatus) {
    return this.academy.listAllWorks(status);
  }

  async reviewWork(user: AuthenticatedUser, workId: string, feedback: string, approved: boolean) {
    const collab = await this.resolveCollaborator(user);
    const status: FinalWorkStatus = approved ? 'APPROVED' : 'REJECTED';

    await this.academy.updateWorkStatus(workId, status);
    const review = await this.academy.reviewWork(workId, collab.id, feedback, approved);

    // If approved → issue certification
    if (approved) {
      const work = await this.academy.listAllWorks();
      const target = work.find((w: { id: string; agentId: string; moduleId: string }) => w.id === workId);
      if (target) {
        await this.academy.issueCertification(target.agentId, target.moduleId);
      }
    }

    return review;
  }

  // ── Certifications ────────────────────────────────────────────────────────────

  async listMyCertifications(user: AuthenticatedUser) {
    const agent = await this.resolveAgent(user);
    return this.academy.listCertifications(agent.id);
  }
}
