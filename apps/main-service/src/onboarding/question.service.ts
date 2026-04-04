import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * QuestionService — manages the dynamic onboarding question catalogue.
 * Staff members can define, list, and seed questions that Agents answer
 * during the onboarding questionnaire phase.
 */
@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns all onboarding questions ordered by creation date (oldest first).
   * Used by the Agent-facing onboarding form to render the question list.
   */
  async findAll() {
    return this.prisma.question.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Creates a single onboarding question.
   * @param data - Prisma-typed payload with title and isRequired flag.
   */
  async create(data: Prisma.QuestionCreateInput) {
    return this.prisma.question.create({ data });
  }

  /**
   * Bulk-creates a set of questions in a single atomic transaction.
   * Primarily used by staff to seed or migrate onboarding flow templates.
   * @param questions - Array of question title strings; all marked as required by default.
   */
  async bulkCreate(questions: string[]) {
    return this.prisma.$transaction(
      questions.map(q => this.prisma.question.create({ data: { title: q, isRequired: true } }))
    );
  }
}
