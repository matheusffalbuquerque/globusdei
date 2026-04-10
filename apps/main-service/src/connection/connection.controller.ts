import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireRealmRoles } from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { CreateConnectionRequestDto } from './dto/create-connection-request.dto';
import { ConnectionService } from './connection.service';

@ApiTags('connections')
@ApiBearerAuth()
@Controller('connections')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class ConnectionController {
  constructor(private readonly connections: ConnectionService) {}

  /** Todos os agentes com status de conexão do usuário autenticado */
  @Get('agents')
  listAllAgents(@CurrentUser() user: AuthenticatedUser) {
    return this.connections.listAllWithStatus(user);
  }

  /** Conexões aceitas do usuário */
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.connections.list(user);
  }

  /** Solicitações recebidas pendentes */
  @Get('pending')
  listPending(@CurrentUser() user: AuthenticatedUser) {
    return this.connections.listPending(user);
  }

  /** Solicitações enviadas pendentes */
  @Get('sent')
  listSent(@CurrentUser() user: AuthenticatedUser) {
    return this.connections.listSentPending(user);
  }

  /** Enviar solicitação de conexão */
  @Post('requests')
  request(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateConnectionRequestDto) {
    return this.connections.request(user, dto.receiverId);
  }

  /** Aceitar solicitação */
  @Post(':id/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.connections.accept(user, id);
  }

  /** Rejeitar solicitação */
  @Post(':id/reject')
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.connections.reject(user, id);
  }

  /** Remover conexão */
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.connections.remove(user, id);
  }
}
