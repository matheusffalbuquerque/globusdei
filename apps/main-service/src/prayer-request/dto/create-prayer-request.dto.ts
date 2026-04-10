import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreatePrayerRequestDto {
  @ApiProperty({ description: 'Pedido de oração (texto livre)', example: 'Peço oração pela minha família...' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  request!: string;
}
