import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireRealmRoles } from '../auth/role.decorators';
import { AuthenticatedUser } from '../auth/user-context.interface';
import { AnswerPrayerRequestDto } from './dto/answer-prayer-request.dto';
import { CreatePrayerRequestDto } from './dto/create-prayer-request.dto';
import { PrayerRequestService } from './prayer-request.service';

@ApiTags('prayer-requests')
@ApiBearerAuth()
@Controller('prayer-requests')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class PrayerRequestController {
  constructor(private readonly service: PrayerRequestService) {}

  // ── Colaborador ─────────────────────────────────────────────────────────────

  /** Lista pedidos PENDENTES — mais antigos primeiro */
  @Get('pending')
  @RequireRealmRoles('colaborador', 'administrador')
  listPending() {
    return this.service.listPending();
  }

  /** Lista pedidos ATENDIDOS — mais recentes primeiro */
  @Get('answered')
  @RequireRealmRoles('colaborador', 'administrador')
  listAnswered() {
    return this.service.listAnswered();
  }

  /** Marca pedido como atendido */
  @Patch(':id/answer')
  @RequireRealmRoles('colaborador', 'administrador')
  answer(
    @Param('id') id: string,
    @Body() dto: AnswerPrayerRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.answer(id, dto, user);
  }

  // ── Agente ──────────────────────────────────────────────────────────────────

  /** Agente: lista os próprios pedidos */
  @Get('mine')
  @RequireRealmRoles('agente')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMine(user);
  }

  /** Agente: cria novo pedido de oração */
  @Post()
  @RequireRealmRoles('agente')
  create(@Body() dto: CreatePrayerRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user);
  }
}
