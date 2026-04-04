import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EmpreendimentoService } from './empreendimento.service';
import { Prisma } from '@prisma/client';

/**
 * Empreendimento Controller
 * Exposes core REST APIs for the main enterprise platform.
 */
@Controller('empreendimentos')
export class EmpreendimentoController {
  constructor(private readonly empService: EmpreendimentoService) {}

  @Get(':id')
  async getEmpreendimento(@Param('id') id: string) {
    const reqUserId = 'SYSTEM_ADMIN_MOCK'; 
    return this.empService.findOne(id, reqUserId);
  }

  @Post()
  async createEmpreendimento(@Body() data: Prisma.EmpreendimentoCreateInput) {
    const reqUserId = 'SYSTEM_ADMIN_MOCK';
    return this.empService.create(data, reqUserId);
  }
}
