import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteStatus, EmpreendimentoAgentRole } from '@prisma/client';
import { ClientProxy } from '@nestjs/microservices';
import * as crypto from 'crypto';

@Injectable()
export class InviteService {
  constructor(
    private prisma: PrismaService,
    @Inject('NOTIFICATION_SERVICE') private client: ClientProxy,
  ) {}

  /**
   * Create an invite for a specific email
   */
  async createInvite(
    empreendimentoId: string,
    inviterId: string,
    email: string,
    role: EmpreendimentoAgentRole = EmpreendimentoAgentRole.CONTRIBUTOR
  ) {
    const empreendimento = await this.prisma.empreendimento.findUnique({ where: { id: empreendimentoId } });
    if (!empreendimento) throw new NotFoundException('Empreendimento não encontrado.');

    // Only owners can invite
    const isOwner = await this.prisma.empreendimentoAgent.findFirst({
      where: { empreendimentoId, agentId: inviterId, role: EmpreendimentoAgentRole.OWNER }
    });
    if (!isOwner) throw new BadRequestException('Apenas o proprietário pode convidar novos membros.');

    const token = crypto.randomBytes(32).toString('hex');

    const invite = await this.prisma.empreendimentoInvite.create({
      data: {
        empreendimentoId,
        inviterId,
        email,
        role,
        token,
        status: InviteStatus.PENDING
      }
    });

    // Emit event for both Email and Dashboard notification
    this.client.emit('onboarding_invite_sent', {
      email,
      empreendimentoName: empreendimento.name,
      token,
      inviterName: inviterId, // Ideally fetch name here
    });

    return invite;
  }

  /**
   * Accept an invite via token
   */
  async acceptInvite(token: string, agentId: string) {
    const invite = await this.prisma.empreendimentoInvite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Convite inválido ou expirado.');
    if (invite.status !== InviteStatus.PENDING) throw new BadRequestException('Este convite já foi processado.');

    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agente não encontrado.');

    return this.prisma.$transaction(async (tx) => {
      // 1. Link agent to empreendimento
      await tx.empreendimentoAgent.create({
        data: {
          agentId,
          empreendimentoId: invite.empreendimentoId,
          role: invite.role
        }
      });

      // 2. Mark invite as accepted
      return tx.empreendimentoInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.ACCEPTED }
      });
    });
  }

  /**
   * List pending invites for an agent by email
   */
  async listMyInvites(email: string) {
    return this.prisma.empreendimentoInvite.findMany({
      where: { email, status: InviteStatus.PENDING },
      include: { empreendimento: true }
    });
  }
}
