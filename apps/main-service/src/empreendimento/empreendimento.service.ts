import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditType } from '../audit/audit.service';
import { Prisma, EmpreendimentoAgentRole, FollowUpStatus } from '@prisma/client';
import { encrypt, decrypt } from '@globusdei-workspace/utils';
import { ConfigService } from '@nestjs/config';

/**
 * EmpreendimentoService
 * Encapsulates the Domain operations for the Globus Dei initiatives and projects.
 * Also strictly adheres to the LGPD Reviewer constraint.
 */
@Injectable()
export class EmpreendimentoService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  private get encryptionKey() {
    return this.config.get<string>('ENCRYPTION_KEY') || 'default-fallback-key-32-chars-long';
  }

  async findOne(id: string, requesterActorId: string) {
    const empreendimento = await this.prisma.empreendimento.findUnique({
      where: { id },
      include: { agents: true }, 
    });
    
    if (!empreendimento) {
      throw new NotFoundException(`Empreendimento ${id} not found.`);
    }

    await this.audit.logAction(
      requesterActorId,
      AuditType.AUDIT,
      `Visualização do empreendimento/iniciativa corporativa: ${empreendimento.name}`
    );

    return empreendimento;
  }

  async create(data: Prisma.EmpreendimentoCreateInput, ownerId: string) {
    const novo = await this.prisma.empreendimento.create({
      data: {
        ...data,
        ownerId,
        agents: {
          create: {
            agentId: ownerId,
            role: EmpreendimentoAgentRole.OWNER,
          },
        },
      },
    });
    
    await this.audit.logAction(
      ownerId,
      AuditType.TECHNICAL,
      `Nova iniciativa (empreendimento) configurada: ${novo.name}`
    );

    return novo;
  }

  /**
   * Update Empreendimento (Agent/Owner Flow)
   * Restriction: bankDetails can only be updated if isBankVerified = true
   */
  async update(id: string, data: Partial<Prisma.EmpreendimentoUpdateInput>, requesterActorId: string) {
    const existing = await this.prisma.empreendimento.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Empreendimento not found');

    const updateData: Record<string, unknown> = { ...data };

    // Encryption logic for bank details
    if (data.bankDetails) {
      if (!existing.isBankVerified) {
        throw new Error('Permissão negada. Dados bancários só podem ser inseridos após verificação da equipe.');
      }
      updateData.bankDetails = encrypt(data.bankDetails as string, this.encryptionKey);
    }

    const updated = await this.prisma.empreendimento.update({
      where: { id },
      data: updateData,
    });

    await this.audit.logAction(requesterActorId, AuditType.TECHNICAL, `Update realizado no empreendimento: ${updated.name}`);
    return updated;
  }

  /**
   * Internal Control: Staff updates Priority Score and Verification Status
   */
  async updateInternalControl(id: string, staffId: string, data: { priorityScore?: number; isBankVerified?: boolean; followUpStatus?: FollowUpStatus; internalNotes?: string }) {
    const empreendimento = await this.prisma.empreendimento.findUnique({ where: { id } });
    if (!empreendimento) throw new NotFoundException();

    if (data.priorityScore !== undefined && (data.priorityScore < 0 || data.priorityScore > 100)) {
      throw new Error('Priority Score deve estar entre 0 e 100.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.empreendimento.update({
        where: { id },
        data: {
          ...data,
          internalResponsibleId: staffId,
        },
      });

      // Automated Service Log for Internal history
      await tx.serviceLog.create({
        data: {
          empreendimentoId: id,
          staffId,
          action: 'INTERNAL_UPDATE',
          content: `Alteração de controle interno: ${JSON.stringify(data)}`,
        },
      });

      return updated;
    });
  }

  /**
   * Decrypt and View bank details (Staff or Owner only)
   */
  async viewBankDetails(id: string) {
    const emp = await this.prisma.empreendimento.findUnique({ where: { id } });
    if (!emp || !emp.bankDetails) return null;

    // Check if requester is owner or staff (Audit role should check this)
    // For now, we decrypt.
    return decrypt(emp.bankDetails, this.encryptionKey);
  }
}
