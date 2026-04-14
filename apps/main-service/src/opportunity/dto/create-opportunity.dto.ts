import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpportunityCategory } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateOpportunityDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ enum: OpportunityCategory })
  @IsOptional()
  @IsEnum(OpportunityCategory)
  category?: OpportunityCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  /** Vincular a um empreendimento do autor (agente owner/manager) */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  empreendimentoId?: string;
}
