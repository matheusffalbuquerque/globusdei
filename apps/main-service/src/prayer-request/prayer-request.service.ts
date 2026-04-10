import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService, AuditType } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/user-context.interface';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerPrayerRequestDto } from './dto/answer-prayer-request.dto';
import { CreatePrayerRequestDto } from './dto/create-prayer-request.dto';
import { PrayerRequestRepository } from './prayer-request.repository';

@Injectable()
export class PrayerRequestService {
  constructor(
    private readonly repo: PrayerRequestRepository,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Colaborador: lista pedidos pendentes (mais antigos primeiro) */
  listPending() {
    return this.repo.listPending();
  }

  /** Colaborador: lista pedidos atendidos (mais recentes primeiro) */
  listAnswered() {
    return this.repo.listAnswered();
  }

  /** Agente: lista os próprios pedidos */
  async listMine(user: AuthenticatedUser) {
    const agent = await this.resolveAgent(user);
    return this.repo.listByAgent(agent.id);
  }

  /** Agente: envia novo pedido */
  async create(dto: CreatePrayerRequestDto, user: AuthenticatedUser) {
    const agent = await this.resolveAgent(user);
    const pr = await this.repo.create(agent.id, dto.request);
    await this.audit.logAction(user.sub, AuditType.AUDIT, `Pedido de oração criado: ${pr.id}`);
    return pr;
  }

  /** Colaborador: marca pedido como atendido */
  async answer(id: string, dto: AnswerPrayerRequestDto, user: AuthenticatedUser) {
    const collaborator = await this.resolveCollaborator(user);
    const pr = await this.repo.findById(id);

    if (!pr) throw new NotFoundException('Pedido de oração não encontrado.');
    if (pr.status === 'ANSWERED') throw new ForbiddenException('Pedido já foi atendido.');

    const updated = await this.repo.markAsAnswered(id, collaborator.id, dto.internalNote);
    await this.audit.logAction(
      user.sub,
      AuditType.TECHNICAL,
      `Pedido de oração ${id} marcado como atendido por ${collaborator.id}.`,
    );
    return updated;
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private async resolveAgent(user: AuthenticatedUser) {
    return this.prisma.agent.findFirstOrThrow({
      where: { authSubject: user.sub },
      select: { id: true },
    });
  }

  private async resolveCollaborator(user: AuthenticatedUser) {
    return this.prisma.collaborator.findFirstOrThrow({
      where: { authSubject: user.sub },
      select: { id: true },
    });
  }
}
