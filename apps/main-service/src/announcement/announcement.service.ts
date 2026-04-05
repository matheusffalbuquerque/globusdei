import { ForbiddenException, Injectable } from '@nestjs/common';
import { AnnouncementType } from '@prisma/client';

import { AuditService, AuditType } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CollaboratorRepository } from '../collaborator/collaborator.repository';
import { AnnouncementRepository } from './announcement.repository';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    private readonly announcements: AnnouncementRepository,
    private readonly collaborators: CollaboratorRepository,
    private readonly audit: AuditService,
  ) {}

  listRecent() {
    return this.announcements.listRecent(10);
  }

  listAll() {
    return this.announcements.listRecent(30);
  }

  async create(dto: CreateAnnouncementDto, user: AuthenticatedUser) {
    const collaborator = await this.collaborators.findBySubjectOrEmail(user.sub, user.email);
    if (!collaborator) {
      throw new ForbiddenException('Missing local collaborator profile.');
    }

    const announcement = await this.announcements.create(
      dto.title,
      dto.content,
      dto.type ?? AnnouncementType.SYSTEM,
      collaborator.id,
      dto.targetId,
    );

    await this.audit.logAction(
      collaborator.id,
      AuditType.TECHNICAL,
      `Criação do announcement ${announcement.id}.`,
    );

    return announcement;
  }

  async delete(id: string, user: AuthenticatedUser) {
    await this.audit.logAction(user.sub, AuditType.SECURITY, `Remoção do announcement ${id}.`);
    return this.announcements.delete(id);
  }
}
