import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { LanguageProficiency } from '@prisma/client';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { CreateAgentExperienceDto } from './dto/experiences/create-experience.dto';
import { CreateAgentEducationDto } from './dto/education/create-education.dto';
import { CreateAgentCourseDto } from './dto/courses/create-course.dto';

@Injectable()
export class AgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.agent.findUnique({
      where: { id },
      include: {
        empreendimentos: {
          include: { empreendimento: true },
        },
        vocationalAreas: {
          include: { vocationalArea: true },
        },
        experiences: {
          include: { experienceType: true },
          orderBy: { startDate: 'desc' },
        },
        education: {
          orderBy: { startDate: 'desc' },
        },
        courses: {
          orderBy: { issueDate: 'desc' },
        },
        skills: {
          include: { skill: true },
        },
        languages: {
          include: { language: true },
        },
      },
    });
  }

  findBySubjectOrEmail(authSubject: string, email: string) {
    return this.prisma.agent.findFirst({
      where: {
        OR: [{ authSubject }, { email }],
      },
      include: {
        vocationalAreas: {
          include: { vocationalArea: true },
        },
        experiences: {
          include: { experienceType: true },
          orderBy: { startDate: 'desc' },
        },
        education: {
          orderBy: { startDate: 'desc' },
        },
        courses: {
          orderBy: { issueDate: 'desc' },
        },
        skills: {
          include: { skill: true },
        },
        languages: {
          include: { language: true },
        },
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.agent.findUnique({
      where: { slug }
    });
  }

  findPublicBySlug(slug: string) {
    return this.prisma.agent.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        publicBio: true,
        shortDescription: true,
        photoUrl: true,
        coverUrl: true,
        city: true,
        state: true,
        country: true,
        portfolioUrl: true,
        currentDenomination: true,
        status: true,
        isActive: true,
        vocationalAreas: {
          include: { vocationalArea: true },
        },
        skills: {
          include: { skill: true },
        },
        languages: {
          include: { language: true },
        },
        experiences: {
          include: { experienceType: true },
          orderBy: { startDate: 'desc' },
        },
        education: {
          orderBy: { startDate: 'desc' },
        },
        courses: {
          orderBy: { issueDate: 'desc' },
        },
      },
    });
  }

  async upsertFromIdentity(params: {
    authSubject: string;
    email: string;
    name: string;
  }) {
    const existing = await this.findBySubjectOrEmail(params.authSubject, params.email);

    if (existing) {
      return this.prisma.agent.update({
        where: { id: existing.id },
        data: {
          authSubject: params.authSubject,
          email: params.email,
          name: params.name,
        },
        include: {
          vocationalAreas: {
            include: { vocationalArea: true },
          },
          experiences: {
            include: { experienceType: true },
            orderBy: { startDate: 'desc' },
          },
          education: {
            orderBy: { startDate: 'desc' },
          },
          courses: {
            orderBy: { issueDate: 'desc' },
          },
          skills: {
            include: { skill: true },
          },
          languages: {
            include: { language: true },
          },
        },
      });
    }

    return this.prisma.agent.create({
      data: {
        authSubject: params.authSubject,
        email: params.email,
        name: params.name,
      },
    });
  }

  async updateProfile(id: string, data: UpdateAgentProfileDto) {
    const { vocationalAreaIds, skillIds, languageRecords, ...rest } = data;

    return this.prisma.$transaction(async (tx) => {
      if (vocationalAreaIds !== undefined) {
        await tx.agentVocationalArea.deleteMany({ where: { agentId: id } });
        if (vocationalAreaIds.length > 0) {
          await tx.agentVocationalArea.createMany({
            data: vocationalAreaIds.map((vId) => ({ agentId: id, vocationalAreaId: vId })),
          });
        }
      }

      if (skillIds !== undefined) {
        await tx.agentSkill.deleteMany({ where: { agentId: id } });
        if (skillIds.length > 0) {
          await tx.agentSkill.createMany({
            data: skillIds.map((sId) => ({ agentId: id, skillId: sId })),
          });
        }
      }

      if (languageRecords !== undefined) {
        await tx.agentLanguage.deleteMany({ where: { agentId: id } });
        if (languageRecords.length > 0) {
          await tx.agentLanguage.createMany({
            data: languageRecords.map((record) => ({ 
              agentId: id, 
              languageId: record.languageId,
              proficiencyLevel: record.proficiencyLevel 
            })),
          });
        }
      }

      return tx.agent.update({
        where: { id },
        data: rest,
      });
    });
  }

  getDashboard(agentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const [connections, following, announcements, serviceRequests, empreendimentos] =
        await Promise.all([
          tx.connection.count({
            where: {
              OR: [
                { senderId: agentId, status: 'ACCEPTED' },
                { receiverId: agentId, status: 'ACCEPTED' },
              ],
            },
          }),
          tx.empreendimentoFollow.count({ where: { agentId } }),
          tx.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          tx.serviceRequest.findMany({
            where: { agentId },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          tx.empreendimentoMember.findMany({
            where: { agentId },
            include: { empreendimento: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
        ]);

      return {
        connections,
        following,
        announcements,
        serviceRequests,
        empreendimentos: empreendimentos.map((member) => member.empreendimento),
      };
    });
  }

  // --- Nested Profile Items ---
  addExperience(agentId: string, data: CreateAgentExperienceDto) {
    return this.prisma.agentExperience.create({
      data: {
        agentId,
        ...data,
      },
    });
  }

  async removeExperience(agentId: string, experienceId: string) {
    return this.prisma.agentExperience.deleteMany({
      where: {
        id: experienceId,
        agentId,
      },
    });
  }

  addEducation(agentId: string, data: CreateAgentEducationDto) {
    return this.prisma.agentEducation.create({
      data: {
        agentId,
        ...data,
      },
    });
  }

  async removeEducation(agentId: string, educationId: string) {
    return this.prisma.agentEducation.deleteMany({
      where: {
        id: educationId,
        agentId,
      },
    });
  }

  addCourse(agentId: string, data: CreateAgentCourseDto) {
    return this.prisma.agentCourse.create({
      data: {
        agentId,
        ...data,
      },
    });
  }

  async removeCourse(agentId: string, courseId: string) {
    return this.prisma.agentCourse.deleteMany({
      where: {
        id: courseId,
        agentId,
      },
    });
  }
}
