import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CollaboratorRole, EmpreendimentoAgentRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { AgentRepository } from '../agent/agent.repository';
import { AuditService, AuditType } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/user-context.interface';
import { CollaboratorRepository } from '../collaborator/collaborator.repository';
import { decrypt, encrypt } from '@globusdei-workspace/utils';
import { CreateEmpreendimentoDto } from './dto/create-empreendimento.dto';
import { CreateEmpreendimentoInviteDto } from './dto/create-empreendimento-invite.dto';
import { UpdateEmpreendimentoDto } from './dto/update-empreendimento.dto';
import { UpdateEmpreendimentoInternalDto } from './dto/update-empreendimento-internal.dto';
import { EmpreendimentoRepository } from './empreendimento.repository';

@Injectable()
export class EmpreendimentoService {
  constructor(
    private readonly empreendimentos: EmpreendimentoRepository,
    private readonly agents: AgentRepository,
    private readonly collaborators: CollaboratorRepository,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  get encryptionKey() {
    return this.config.get<string>('ENCRYPTION_KEY') ?? 'globusdei-development-key';
  }

  listAll() {
    return this.empreendimentos.listAll();
  }

  async listMine(user: AuthenticatedUser) {
    const agent = await this.ensureAgent(user);
    return this.empreendimentos.findMine(agent.id);
  }

  async findOne(id: string, requester: AuthenticatedUser) {
    const empreendimento = await this.empreendimentos.findById(id);
    if (!empreendimento) {
      throw new NotFoundException('Empreendimento not found.');
    }

    await this.audit.logAction(
      requester.sub,
      AuditType.AUDIT,
      `Visualização do empreendimento ${id}.`,
    );

    return empreendimento;
  }

  async create(user: AuthenticatedUser, dto: CreateEmpreendimentoDto) {
    const agent = await this.ensureAgent(user);
    const empreendimento = await this.empreendimentos.create(agent.id, dto);

    await this.audit.logAction(
      agent.id,
      AuditType.TECHNICAL,
      `Criação do empreendimento ${empreendimento.id}.`,
    );

    return empreendimento;
  }

  async update(id: string, user: AuthenticatedUser, dto: UpdateEmpreendimentoDto) {
    const agent = await this.ensureAgent(user);
    await this.assertAgentCanManage(id, agent.id);

    let encryptedBankDetails: string | null | undefined;
    if (dto.bankDetails !== undefined) {
      const empreendimento = await this.empreendimentos.findById(id);
      if (!empreendimento) {
        throw new NotFoundException('Empreendimento not found.');
      }

      if (!empreendimento.isBankVerified) {
        throw new ForbiddenException('Bank details are locked until collaborator validation.');
      }

      encryptedBankDetails = dto.bankDetails
        ? encrypt(dto.bankDetails, this.encryptionKey)
        : null;
    }

    const updated = await this.empreendimentos.update(id, dto, encryptedBankDetails);
    await this.audit.logAction(agent.id, AuditType.TECHNICAL, `Atualização do empreendimento ${id}.`);
    return updated;
  }

  async updateInternal(id: string, user: AuthenticatedUser, dto: UpdateEmpreendimentoInternalDto) {
    const collaborator = await this.collaborators.findBySubjectOrEmail(user.sub, user.email);

    if (!collaborator) {
      throw new ForbiddenException('Missing local collaborator profile.');
    }

    const canManage =
      collaborator.roles.includes(CollaboratorRole.ADMIN) ||
      collaborator.roles.includes(CollaboratorRole.PROJECT_MANAGER);

    if (!canManage) {
      throw new ForbiddenException('Missing collaborator role for internal empreendimento management.');
    }

    const updated = await this.empreendimentos.updateInternal(id, collaborator.id, dto);
    await this.audit.logAction(
      collaborator.id,
      AuditType.AUDIT,
      `Atualização interna do empreendimento ${id}.`,
    );
    return updated;
  }

  async listMembers(id: string) {
    return this.empreendimentos.listMembers(id);
  }

  async getBankDetails(id: string, user: AuthenticatedUser) {
    const empreendimento = await this.empreendimentos.findById(id);
    if (!empreendimento || !empreendimento.bankDetails) {
      throw new NotFoundException('Bank details not found.');
    }

    const agent = await this.agents.findBySubjectOrEmail(user.sub, user.email);
    const membership = agent
      ? await this.empreendimentos.getMembership(id, agent.id)
      : null;

    const collaborator = user.realmRoles.some((role) =>
      ['colaborador', 'administrador'].includes(role),
    )
      ? await this.collaborators.findBySubjectOrEmail(user.sub, user.email)
      : null;

    const isAuthorizedAgent = membership?.role === EmpreendimentoAgentRole.OWNER;
    const isAuthorizedCollaborator =
      collaborator?.roles.includes(CollaboratorRole.ADMIN) ||
      collaborator?.roles.includes(CollaboratorRole.PROJECT_MANAGER) ||
      empreendimento.internalResponsibleId === collaborator?.id;

    if (!isAuthorizedAgent && !isAuthorizedCollaborator) {
      throw new ForbiddenException('You do not have permission to view bank details.');
    }

    await this.audit.logAction(
      collaborator?.id ?? agent?.id ?? user.sub,
      AuditType.AUDIT,
      `Visualização de dados bancários do empreendimento ${id}.`,
    );

    return {
      bankDetails: decrypt(empreendimento.bankDetails, this.encryptionKey),
    };
  }

  async createInvite(
    empreendimentoId: string,
    user: AuthenticatedUser,
    dto: CreateEmpreendimentoInviteDto,
  ) {
    const agent = await this.ensureAgent(user);
    await this.assertAgentCanManage(empreendimentoId, agent.id);

    const token = crypto.randomBytes(24).toString('hex');
    const invite = await this.empreendimentos.createInvite({
      empreendimentoId,
      inviterId: agent.id,
      email: dto.email,
      role: dto.role ?? EmpreendimentoAgentRole.CONTRIBUTOR,
      token,
    });

    await this.audit.logAction(
      agent.id,
      AuditType.TECHNICAL,
      `Convite criado para ${dto.email} no empreendimento ${empreendimentoId}.`,
    );

    return invite;
  }

  listMyInvites(user: AuthenticatedUser) {
    return this.empreendimentos.listInvitesByEmail(user.email);
  }

  async acceptInvite(token: string, user: AuthenticatedUser) {
    const agent = await this.ensureAgent(user);
    const invite = await this.empreendimentos.findInviteByToken(token);

    if (!invite) {
      throw new NotFoundException('Invite not found.');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Invite has already been processed.');
    }

    if (invite.email.toLowerCase() !== agent.email.toLowerCase()) {
      throw new ForbiddenException('Invite email does not match the authenticated agent.');
    }

    const accepted = await this.empreendimentos.acceptInvite(
      invite.id,
      invite.empreendimentoId,
      agent.id,
      invite.role,
    );

    await this.audit.logAction(
      agent.id,
      AuditType.TECHNICAL,
      `Convite aceito no empreendimento ${invite.empreendimentoId}.`,
    );

    return accepted;
  }

  private async ensureAgent(user: AuthenticatedUser) {
    return this.agents.upsertFromIdentity({
      authSubject: user.sub,
      email: user.email,
      name: user.name,
    });
  }

  private async assertAgentCanManage(empreendimentoId: string, agentId: string) {
    const membership = await this.empreendimentos.getMembership(empreendimentoId, agentId);

    if (!membership) {
      throw new ForbiddenException('Agent is not linked to this empreendimento.');
    }

    if (
      membership.role !== EmpreendimentoAgentRole.OWNER &&
      membership.role !== EmpreendimentoAgentRole.MANAGER
    ) {
      throw new ForbiddenException('Agent cannot manage this empreendimento.');
    }
  }
}
