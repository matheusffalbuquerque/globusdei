import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  async follow(agentId: string, empreendimentoId: string) {
    const emp = await this.prisma.empreendimento.findUnique({ where: { id: empreendimentoId } });
    if (!emp) throw new NotFoundException('Empreendimento not found.');

    const existing = await this.prisma.empreendimentoFollow.findUnique({
      where: {
        agentId_empreendimentoId: { agentId, empreendimentoId },
      },
    });

    if (existing) throw new ConflictException('Already following.');

    return this.prisma.empreendimentoFollow.create({
      data: { agentId, empreendimentoId },
    });
  }

  async unfollow(agentId: string, empreendimentoId: string) {
    return this.prisma.empreendimentoFollow.delete({
      where: {
        agentId_empreendimentoId: { agentId, empreendimentoId },
      },
    });
  }

  async getFollowing(agentId: string) {
    return this.prisma.empreendimentoFollow.findMany({
      where: { agentId },
      include: { empreendimento: true },
    });
  }
}
