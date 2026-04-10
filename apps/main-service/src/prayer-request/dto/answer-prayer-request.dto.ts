import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AnswerPrayerRequestDto {
  @ApiPropertyOptional({ description: 'Nota interna do colaborador ao atender o pedido' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNote?: string;
}
