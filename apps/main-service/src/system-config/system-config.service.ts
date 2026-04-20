import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemConfigService {
  constructor(private readonly prisma: PrismaService) {}

  getNationalities() {
    return this.prisma.nationality.findMany({ orderBy: { name: 'asc' } });
  }

  getLanguages() {
    return this.prisma.language.findMany({ orderBy: { name: 'asc' } });
  }

  getSkills() {
    return this.prisma.skill.findMany({ orderBy: { name: 'asc' } });
  }

  getVocationalAreas() {
    return this.prisma.vocationalArea.findMany({ orderBy: { name: 'asc' } });
  }

  getExperienceTypes() {
    return this.prisma.experienceType.findMany({ orderBy: { name: 'asc' } });
  }

  createSkill(data: { name: string; description?: string }) {
    return this.prisma.skill.create({ data });
  }

  createVocationalArea(data: { name: string; description?: string }) {
    return this.prisma.vocationalArea.create({ data });
  }

  createExperienceType(data: { name: string; description?: string }) {
    return this.prisma.experienceType.create({ data });
  }

  deleteSkill(id: string) {
    return this.prisma.skill.delete({ where: { id } });
  }

  deleteVocationalArea(id: string) {
    return this.prisma.vocationalArea.delete({ where: { id } });
  }

  deleteExperienceType(id: string) {
    return this.prisma.experienceType.delete({ where: { id } });
  }
}
