import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { AgentInvestmentTargetType, AgentInvestmentType } from '@prisma/client';

export class CreateInvestmentDto {
  @ApiProperty({ description: 'Valor do investimento em reais' })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ enum: AgentInvestmentTargetType, description: 'Tipo de alvo: AGENT ou EMPREENDIMENTO' })
  @IsEnum(AgentInvestmentTargetType)
  @IsNotEmpty()
  targetType!: AgentInvestmentTargetType;

  @ApiPropertyOptional({ description: 'ID do agente alvo (quando targetType=AGENT)' })
  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => o.targetType === AgentInvestmentTargetType.AGENT)
  @IsNotEmpty()
  targetAgentId?: string;

  @ApiPropertyOptional({ description: 'ID do empreendimento alvo (quando targetType=EMPREENDIMENTO)' })
  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => o.targetType === AgentInvestmentTargetType.EMPREENDIMENTO)
  @IsNotEmpty()
  targetEmpreendimentoId?: string;

  @ApiProperty({ enum: AgentInvestmentType, description: 'ONE_TIME ou RECURRING', default: 'ONE_TIME' })
  @IsEnum(AgentInvestmentType)
  @IsOptional()
  type?: AgentInvestmentType = AgentInvestmentType.ONE_TIME;

  @ApiPropertyOptional({ description: 'Observações sobre o investimento' })
  @IsString()
  @IsOptional()
  notes?: string;
}
