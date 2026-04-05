import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { CreateEmpreendimentoDto } from './create-empreendimento.dto';

export class UpdateEmpreendimentoDto extends PartialType(CreateEmpreendimentoDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankDetails?: string;
}
