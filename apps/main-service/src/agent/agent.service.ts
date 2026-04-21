import { Injectable, NotFoundException } from '@nestjs/common';

import { AuditService, AuditType } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { StorageService } from '../storage/storage.service';
import { AgentRepository } from './agent.repository';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { CreateAgentExperienceDto } from './dto/experiences/create-experience.dto';
import { CreateAgentEducationDto } from './dto/education/create-education.dto';
import { CreateAgentCourseDto } from './dto/courses/create-course.dto';

@Injectable()
export class AgentService {
  constructor(
    private readonly agents: AgentRepository,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  async getMe(user: AuthenticatedUser) {
    const agent = await this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });

    return this.normalizeProfileMedia(agent);
  }

  async findOne(id: string, requester: AuthenticatedUser) {
    const agent = await this.agents.findById(id);

    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found.`);
    }

    await this.audit.logAction(
      requester.sub,
      AuditType.AUDIT,
      `Visualização de dados do agente ${agent.id}.`,
    );

    return agent;
  }

  async updateMe(user: AuthenticatedUser, data: UpdateAgentProfileDto) {
    const agent = await this.getMe(user);
    const normalizedSlug = this.normalizeSlug(data.slug);
    const normalizedData = {
      ...data,
      slug: normalizedSlug,
      photoFileId: this.normalizeNullableString(data.photoFileId),
      coverFileId: this.normalizeNullableString(data.coverFileId),
      portfolioFileId: this.normalizeNullableString(data.portfolioFileId),
      photoUrl: undefined,
      coverUrl: undefined,
      portfolioUrl: undefined,
    };

    if (normalizedSlug && normalizedSlug !== agent.slug) {
      const slugCheck = await this.checkSlug(normalizedSlug, agent.id);
      if (!slugCheck.available) {
        throw new Error(`Slug não pode ser salvo: ${slugCheck.reason}`);
      }
    }

    const updated = await this.agents.updateProfile(agent.id, normalizedData);

    await this.audit.logAction(
      agent.id,
      AuditType.TECHNICAL,
      'Atualização do perfil do agente.',
    );

    return this.normalizeProfileMedia(updated);
  }

  async getDashboard(user: AuthenticatedUser) {
    const agent = await this.getMe(user);

    await this.audit.logAction(
      agent.id,
      AuditType.AUDIT,
      'Visualização do dashboard do agente.',
    );

    return this.agents.getDashboard(agent.id);
  }

  async provisionFromRegister(params: { authSubject: string; email: string; name: string }) {
    return this.agents.upsertFromIdentity(params);
  }

  async getPublicProfile(slug: string) {
    const agent = await this.agents.findPublicBySlug(slug);
    if (!agent || !agent.isActive || agent.status !== 'APPROVED') {
      throw new NotFoundException(`Perfil não encontrado.`);
    }
    return this.normalizeProfileMedia(agent);
  }

  async checkSlug(slug: string, currentAgentId?: string) {
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { available: false, reason: 'Formato inválido. Use apenas minúsculas, números e hifens.' };
    }
    const existing = await this.agents.findBySlug(slug);
    if (!existing) {
      return { available: true };
    }
    if (existing.id === currentAgentId) {
      return { available: true };
    }
    return { available: false, reason: 'O slug já está em uso.' };
  }
  // --- Profile Nested Entities CRUD ---
  async addExperience(user: AuthenticatedUser, data: CreateAgentExperienceDto) {
    const agent = await this.getMe(user);
    return this.agents.addExperience(agent.id, data);
  }

  async removeExperience(user: AuthenticatedUser, experienceId: string) {
    const agent = await this.getMe(user);
    return this.agents.removeExperience(agent.id, experienceId);
  }

  async addEducation(user: AuthenticatedUser, data: CreateAgentEducationDto) {
    const agent = await this.getMe(user);
    return this.agents.addEducation(agent.id, data);
  }

  async removeEducation(user: AuthenticatedUser, educationId: string) {
    const agent = await this.getMe(user);
    return this.agents.removeEducation(agent.id, educationId);
  }

  async addCourse(user: AuthenticatedUser, data: CreateAgentCourseDto) {
    const agent = await this.getMe(user);
    return this.agents.addCourse(agent.id, data);
  }

  async removeCourse(user: AuthenticatedUser, courseId: string) {
    const agent = await this.getMe(user);
    return this.agents.removeCourse(agent.id, courseId);
  }

  private normalizeProfileMedia<
    T extends {
      photoUrl?: string | null;
      photoFileId?: string | null;
      photoFile?: { key: string } | null;
      coverUrl?: string | null;
      coverFileId?: string | null;
      coverFile?: { key: string } | null;
      portfolioUrl?: string | null;
      portfolioFileId?: string | null;
      portfolioFile?: { key: string } | null;
    },
  >(
    profile: T,
  ): T {
    const photoUrl = profile.photoFile?.key
      ? this.storage.getPublicUrl(profile.photoFile.key)
      : this.storage.normalizePublicUrl(profile.photoUrl) ?? profile.photoUrl;
    const coverUrl = profile.coverFile?.key
      ? this.storage.getPublicUrl(profile.coverFile.key)
      : this.storage.normalizePublicUrl(profile.coverUrl) ?? profile.coverUrl;
    const portfolioUrl = profile.portfolioFile?.key
      ? this.storage.getPublicUrl(profile.portfolioFile.key)
      : this.storage.normalizePublicUrl(profile.portfolioUrl) ?? profile.portfolioUrl;

    return {
      ...profile,
      photoUrl,
      coverUrl,
      portfolioUrl,
    };
  }

  private normalizeSlug(slug?: string | null): string | null | undefined {
    if (slug === undefined) {
      return undefined;
    }

    const normalized = slug?.trim().toLowerCase() ?? '';
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeNullableString(value?: string | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : null;
  }
}
