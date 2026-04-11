import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type FinalWorkStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const LESSON_SELECT = {
  id: true, title: true, description: true, youtubeUrl: true, order: true,
  materials: { select: { id: true, title: true, url: true } },
  _count: { select: { progresses: true } },
};

const MODULE_SELECT = {
  id: true, title: true, description: true, coverUrl: true,
  workInstructions: true, isPublished: true, order: true, createdAt: true,
  _count: { select: { lessons: true, enrollments: true, certifications: true } },
};

const MODULE_SELECT_WITH_LESSONS = {
  ...MODULE_SELECT,
  lessons: {
    orderBy: { order: 'asc' as const },
    select: LESSON_SELECT,
  },
};

@Injectable()
export class AcademyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Modules ─────────────────────────────────────────────────────────────────

  createModule(data: {
    title: string; description: string; coverUrl?: string;
    workInstructions?: string; isPublished?: boolean; order?: number;
  }) {
    return this.prisma.academyModule.create({ data, select: MODULE_SELECT });
  }

  updateModule(id: string, data: Partial<{
    title: string; description: string; coverUrl: string;
    workInstructions: string; isPublished: boolean; order: number;
  }>) {
    return this.prisma.academyModule.update({ where: { id }, data, select: MODULE_SELECT });
  }

  findModule(id: string) {
    return this.prisma.academyModule.findUnique({
      where: { id },
      select: {
        ...MODULE_SELECT,
        lessons: {
          orderBy: { order: 'asc' },
          select: LESSON_SELECT,
        },
      },
    });
  }

  listModules(publishedOnly = false) {
    return this.prisma.academyModule.findMany({
      where: publishedOnly ? { isPublished: true } : undefined,
      orderBy: { order: 'asc' },
      select: MODULE_SELECT,
    });
  }

  listModulesWithLessons(publishedOnly = false) {
    return this.prisma.academyModule.findMany({
      where: publishedOnly ? { isPublished: true } : undefined,
      orderBy: { order: 'asc' },
      select: MODULE_SELECT_WITH_LESSONS,
    });
  }

  // ── Enrollments ──────────────────────────────────────────────────────────────

  enroll(agentId: string, moduleId: string) {
    return this.prisma.agentModuleEnrollment.upsert({
      where: { agentId_moduleId: { agentId, moduleId } },
      create: { agentId, moduleId },
      update: {},
    });
  }

  listEnrolledModuleIds(agentId: string) {
    return this.prisma.agentModuleEnrollment.findMany({
      where: { agentId },
      select: { moduleId: true },
    });
  }

  // ── Lessons ──────────────────────────────────────────────────────────────────

  createLesson(moduleId: string, data: {
    title: string; description: string; youtubeUrl?: string; order?: number;
  }) {
    return this.prisma.lesson.create({
      data: { ...data, moduleId },
      select: LESSON_SELECT,
    });
  }

  updateLesson(id: string, data: Partial<{
    title: string; description: string; youtubeUrl: string; order: number;
  }>) {
    return this.prisma.lesson.update({ where: { id }, data, select: LESSON_SELECT });
  }

  findLesson(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        materials: true,
        questions: {
          orderBy: { createdAt: 'desc' },
          include: {
            agent: { select: { id: true, name: true, email: true } },
            answers: {
              include: { collaborator: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
  }

  // ── Materials ─────────────────────────────────────────────────────────────────

  addMaterial(lessonId: string, title: string, url: string) {
    return this.prisma.lessonMaterial.create({ data: { lessonId, title, url } });
  }

  removeMaterial(id: string) {
    return this.prisma.lessonMaterial.delete({ where: { id } });
  }

  // ── Progress ──────────────────────────────────────────────────────────────────

  markComplete(lessonId: string, agentId: string) {
    return this.prisma.lessonProgress.upsert({
      where: { lessonId_agentId: { lessonId, agentId } },
      create: { lessonId, agentId },
      update: {},
    });
  }

  listCompletedLessonIds(agentId: string, moduleId: string) {
    return this.prisma.lessonProgress.findMany({
      where: {
        agentId,
        lesson: { moduleId },
      },
      select: { lessonId: true },
    });
  }

  countLessonsInModule(moduleId: string) {
    return this.prisma.lesson.count({ where: { moduleId } });
  }

  // ── Questions ─────────────────────────────────────────────────────────────────

  createQuestion(lessonId: string, agentId: string, content: string) {
    return this.prisma.lessonQuestion.create({
      data: { lessonId, agentId, content },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        answers: true,
      },
    });
  }

  listQuestionsForLesson(lessonId: string) {
    return this.prisma.lessonQuestion.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        answers: {
          include: { collaborator: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  listAllPendingQuestions() {
    return this.prisma.lessonQuestion.findMany({
      where: { answers: { none: {} } },
      orderBy: { createdAt: 'asc' },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        lesson: {
          select: {
            id: true, title: true,
            module: { select: { id: true, title: true } },
          },
        },
        answers: {
          include: { collaborator: { select: { id: true, name: true } } },
        },
      },
    });
  }

  listAllQuestions() {
    return this.prisma.lessonQuestion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        lesson: {
          select: {
            id: true, title: true,
            module: { select: { id: true, title: true } },
          },
        },
        answers: {
          include: { collaborator: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  answerQuestion(questionId: string, collaboratorId: string, content: string) {
    return this.prisma.lessonAnswer.create({
      data: { questionId, collaboratorId, content },
      include: { collaborator: { select: { id: true, name: true } } },
    });
  }

  // ── Final Works ───────────────────────────────────────────────────────────────

  submitWork(moduleId: string, agentId: string, content?: string, fileUrl?: string) {
    return this.prisma.finalWork.upsert({
      where: { moduleId_agentId: { moduleId, agentId } },
      create: { moduleId, agentId, content, fileUrl, status: 'PENDING' },
      update: { content, fileUrl, status: 'PENDING' },
      include: { review: true },
    });
  }

  findWork(moduleId: string, agentId: string) {
    return this.prisma.finalWork.findUnique({
      where: { moduleId_agentId: { moduleId, agentId } },
      include: { review: true },
    });
  }

  listAllWorks(status?: FinalWorkStatus) {
    return this.prisma.finalWork.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        module: { select: { id: true, title: true } },
        review: { include: { collaborator: { select: { id: true, name: true } } } },
      },
    });
  }

  reviewWork(workId: string, collaboratorId: string, feedback: string, approved: boolean) {
    return this.prisma.finalWorkReview.upsert({
      where: { workId },
      create: { workId, collaboratorId, feedback, approved },
      update: { collaboratorId, feedback, approved },
    });
  }

  updateWorkStatus(workId: string, status: FinalWorkStatus) {
    return this.prisma.finalWork.update({ where: { id: workId }, data: { status } });
  }

  // ── Certifications ────────────────────────────────────────────────────────────

  issueCertification(agentId: string, moduleId: string) {
    return this.prisma.agentCertification.upsert({
      where: { agentId_moduleId: { agentId, moduleId } },
      create: { agentId, moduleId },
      update: {},
    });
  }

  listCertifications(agentId: string) {
    return this.prisma.agentCertification.findMany({
      where: { agentId },
      include: { module: { select: { id: true, title: true, coverUrl: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
