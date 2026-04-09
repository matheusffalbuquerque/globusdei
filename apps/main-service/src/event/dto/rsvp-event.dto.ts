import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class RsvpEventDto {
  @ApiProperty({ description: 'true = confirmar presença, false = cancelar presença' })
  @IsBoolean()
  confirmed!: boolean;
}
