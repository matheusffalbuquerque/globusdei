import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmpreendimentoAgentRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class CreateEmpreendimentoInviteDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: EmpreendimentoAgentRole })
  @IsOptional()
  @IsEnum(EmpreendimentoAgentRole)
  role?: EmpreendimentoAgentRole;
}
