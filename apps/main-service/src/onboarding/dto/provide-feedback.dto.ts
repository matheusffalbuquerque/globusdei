import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class ProvideFeedbackDto {
  @ApiProperty()
  @IsString()
  feedbackText!: string;

  @ApiProperty()
  @IsBoolean()
  approve!: boolean;
}
