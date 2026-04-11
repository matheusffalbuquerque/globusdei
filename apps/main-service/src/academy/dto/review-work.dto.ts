import { IsBoolean, IsString, MinLength } from 'class-validator';

export class ReviewWorkDto {
  @IsBoolean() approved: boolean;
  @IsString() @MinLength(5) feedback: string;
}
