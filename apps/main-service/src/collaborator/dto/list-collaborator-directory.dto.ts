import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus, CollaboratorRole } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Shared filters for the collaborator directory pages.
 * The frontend uses the same DTO for the platform agent listing and the team-only listing.
 */
export class ListCollaboratorDirectoryDto {
  @ApiPropertyOptional({ description: 'Busca textual por nome, e-mail, cidade ou país.' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CollaboratorRole, description: 'Filtra por papel local.' })
  @IsOptional()
  @IsEnum(CollaboratorRole)
  role?: CollaboratorRole;

  @ApiPropertyOptional({ enum: AgentStatus, description: 'Filtra por status do agente.' })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @ApiPropertyOptional({ description: 'Página atual para paginação simples.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Quantidade máxima de itens por página.', maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;
}
