import { Injectable } from '@nestjs/common';
import { AgentStatus, CollaboratorRole, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ListCollaboratorDirectoryDto } from './dto/list-collaborator-directory.dto';

type PlatformAgentDirectoryItem = {
  id: string;
  authSubject: string | null;
  name: string;
  email: string;
  city: string | null;
  country: string | null;
  status: AgentStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  collaborator: {
    id: string;
    authSubject: string;
    roles: CollaboratorRole[];
    isActive: boolean;
    updatedAt: Date;
  } | null;
};

type TeamCollaboratorDirectoryItem = {
  id: string;
  authSubject: string;
  name: string;
  email: string;
  roles: CollaboratorRole[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  agent: {
    id: string;
    status: AgentStatus;
    city: string | null;
    country: string | null;
    isActive: boolean;
  } | null;
};

@Injectable()
export class CollaboratorRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Shared agent selection for directory pages.
   */
  private readonly platformAgentSelect = {
    id: true,
    authSubject: true,
    name: true,
    email: true,
    city: true,
    country: true,
    status: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.AgentSelect;

  /**
   * Shared collaborator selection for directory pages.
   */
  private readonly collaboratorSelect = {
    id: true,
    authSubject: true,
    name: true,
    email: true,
    roles: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.CollaboratorSelect;

  findBySubjectOrEmail(authSubject: string, email: string) {
    return this.prisma.collaborator.findFirst({
      where: {
        OR: [{ authSubject }, { email }],
      },
    });
  }

  findByAgentIdentity(params: { authSubject?: string | null; email: string }) {
    const orFilters: Prisma.CollaboratorWhereInput[] = [{ email: params.email }];

    if (params.authSubject) {
      orFilters.unshift({ authSubject: params.authSubject });
    }

    return this.prisma.collaborator.findFirst({
      where: { OR: orFilters },
    });
  }

  findAgentById(id: string) {
    return this.prisma.agent.findUnique({
      where: { id },
      select: this.platformAgentSelect,
    });
  }

  async upsertFromIdentity(params: {
    authSubject: string;
    email: string;
    name: string;
    /** Roles derivados do realm do Keycloak — sincronizados automaticamente quando o
     *  colaborador ainda não possui roles atribuídos localmente. */
    realmDerivedRoles: CollaboratorRole[];
  }) {
    const existing = await this.findBySubjectOrEmail(params.authSubject, params.email);

    if (existing) {
      // Sincroniza roles apenas se o colaborador ainda não tiver roles locais definidos,
      // preservando qualquer atribuição manual feita por um ADMIN.
      const shouldSyncRoles =
        existing.roles.length === 0 && params.realmDerivedRoles.length > 0;

      return this.prisma.collaborator.update({
        where: { id: existing.id },
        data: {
          authSubject: params.authSubject,
          email: params.email,
          name: params.name,
          ...(shouldSyncRoles ? { roles: params.realmDerivedRoles } : {}),
        },
      });
    }

    return this.prisma.collaborator.create({
      data: {
        authSubject: params.authSubject,
        email: params.email,
        name: params.name,
        roles: params.realmDerivedRoles,
        expertiseAreas: [],
      },
    });
  }

  /**
   * Materializes or refreshes a local collaborator profile from an agent identity.
   * This is the domain bridge that turns a platform agent into a team collaborator.
   */
  async upsertFromAgent(params: {
    agentId: string;
    authSubject: string;
    email: string;
    name: string;
    roles: CollaboratorRole[];
  }) {
    const existing = await this.findByAgentIdentity({
      authSubject: params.authSubject,
      email: params.email,
    });

    if (existing) {
      return this.prisma.collaborator.update({
        where: { id: existing.id },
        data: {
          authSubject: params.authSubject,
          email: params.email,
          name: params.name,
          roles: params.roles,
        },
      });
    }

    return this.prisma.collaborator.create({
      data: {
        authSubject: params.authSubject,
        email: params.email,
        name: params.name,
        roles: params.roles,
        expertiseAreas: [],
        notes: `Perfil materializado a partir do agente ${params.agentId}.`,
      },
    });
  }

  listAll() {
    return this.prisma.collaborator.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  updateRoles(id: string, roles: CollaboratorRole[]) {
    return this.prisma.collaborator.update({
      where: { id },
      data: { roles },
    });
  }

  /**
   * Returns the platform directory so the collaborator UI can search any registered agent.
   */
  async listPlatformAgents(
    dto: ListCollaboratorDirectoryDto,
  ): Promise<{ data: PlatformAgentDirectoryItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const where: Prisma.AgentWhereInput = {
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.search
        ? {
            OR: [
              { name: { contains: dto.search, mode: 'insensitive' } },
              { email: { contains: dto.search, mode: 'insensitive' } },
              { city: { contains: dto.search, mode: 'insensitive' } },
              { country: { contains: dto.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 25;

    const [total, agents] = await this.prisma.$transaction([
      this.prisma.agent.count({ where }),
      this.prisma.agent.findMany({
        where,
        select: this.platformAgentSelect,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        ...(dto.role ? {} : { skip: (page - 1) * limit, take: limit }),
      }),
    ]);

    const collaborators = await this.prisma.collaborator.findMany({
      where: {
        OR: [
          {
            authSubject: {
              in: agents
                .map((agent) => agent.authSubject)
                .filter((value): value is string => Boolean(value)),
            },
          },
          {
            email: {
              in: agents.map((agent) => agent.email),
            },
          },
        ],
      },
      select: {
        id: true,
        authSubject: true,
        email: true,
        roles: true,
        isActive: true,
        updatedAt: true,
      },
    });

    const collaboratorByIdentity = new Map<string, (typeof collaborators)[number]>();
    for (const collaborator of collaborators) {
      collaboratorByIdentity.set(`auth:${collaborator.authSubject}`, collaborator);
      collaboratorByIdentity.set(`email:${collaborator.email.toLowerCase()}`, collaborator);
    }

    const data = agents
      .map((agent) => {
        const collaborator =
          (agent.authSubject
            ? collaboratorByIdentity.get(`auth:${agent.authSubject}`)
            : undefined) ??
          collaboratorByIdentity.get(`email:${agent.email.toLowerCase()}`) ??
          null;

        return {
          ...agent,
          collaborator: collaborator
            ? {
                id: collaborator.id,
                authSubject: collaborator.authSubject,
                roles: collaborator.roles,
                isActive: collaborator.isActive,
                updatedAt: collaborator.updatedAt,
              }
            : null,
        };
      });

    const filteredData = data.filter(
      (agent) => !dto.role || agent.collaborator?.roles.includes(dto.role),
    );
    const paginatedData = dto.role
      ? filteredData.slice((page - 1) * limit, page * limit)
      : filteredData;

    const effectiveTotal = dto.role ? filteredData.length : total;

    return {
      data: paginatedData,
      meta: {
        total: effectiveTotal,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(effectiveTotal / limit)),
      },
    };
  }

  /**
   * Returns only local collaborators with active team roles for the internal team directory.
   */
  async listTeam(
    dto: ListCollaboratorDirectoryDto,
  ): Promise<{ data: TeamCollaboratorDirectoryItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const where: Prisma.CollaboratorWhereInput = {
      roles: dto.role ? { has: dto.role } : { isEmpty: false },
      ...(dto.search
        ? {
            OR: [
              { name: { contains: dto.search, mode: 'insensitive' } },
              { email: { contains: dto.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 25;

    const [total, collaborators] = await this.prisma.$transaction([
      this.prisma.collaborator.count({ where }),
      this.prisma.collaborator.findMany({
        where,
        select: this.collaboratorSelect,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        ...(dto.status ? {} : { skip: (page - 1) * limit, take: limit }),
      }),
    ]);

    const agents = await this.prisma.agent.findMany({
      where: {
        OR: [
          {
            authSubject: {
              in: collaborators.map((item) => item.authSubject),
            },
          },
          {
            email: {
              in: collaborators.map((item) => item.email),
            },
          },
        ],
        ...(dto.status ? { status: dto.status } : {}),
      },
      select: this.platformAgentSelect,
    });

    const agentByIdentity = new Map<string, (typeof agents)[number]>();
    for (const agent of agents) {
      if (agent.authSubject) {
        agentByIdentity.set(`auth:${agent.authSubject}`, agent);
      }
      agentByIdentity.set(`email:${agent.email.toLowerCase()}`, agent);
    }

    const data = collaborators
      .map((collaborator) => {
        const agent =
          agentByIdentity.get(`auth:${collaborator.authSubject}`) ??
          agentByIdentity.get(`email:${collaborator.email.toLowerCase()}`) ??
          null;

        return {
          ...collaborator,
          agent: agent
            ? {
                id: agent.id,
                status: agent.status,
                city: agent.city,
                country: agent.country,
                isActive: agent.isActive,
              }
            : null,
        };
      });

    const filteredData = data.filter((item) => !dto.status || item.agent?.status === dto.status);
    const paginatedData = dto.status
      ? filteredData.slice((page - 1) * limit, page * limit)
      : filteredData;

    const effectiveTotal = dto.status ? filteredData.length : total;

    return {
      data: paginatedData,
      meta: {
        total: effectiveTotal,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(effectiveTotal / limit)),
      },
    };
  }

  getDashboard(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const [pendingAgents, managedEmpreendimentos, openRequests, totalAnnouncements] =
        await Promise.all([
          tx.agent.count({ where: { status: { in: ['SUBMITTED', 'QUALIFIED', 'SCHEDULED'] } } }),
          tx.empreendimento.count({ where: { internalResponsibleId: id } }),
          tx.serviceRequest.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
          tx.announcement.count(),
        ]);

      return {
        pendingAgents,
        managedEmpreendimentos,
        openRequests,
        totalAnnouncements,
      };
    });
  }
}
