import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLessonDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(5) description: string;
  @IsOptional() @IsString() youtubeUrl?: string;
  @IsOptional() @IsNumber() order?: number;
}
