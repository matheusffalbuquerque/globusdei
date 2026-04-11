import { IsString, MinLength } from 'class-validator';

export class AskQuestionDto {
  @IsString() @MinLength(5) content: string;
}
