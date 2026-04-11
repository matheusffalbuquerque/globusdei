import { IsOptional, IsString, MinLength } from 'class-validator';

export class SubmitWorkDto {
  @IsOptional() @IsString() @MinLength(10) content?: string;
  @IsOptional() @IsString() fileUrl?: string;
}
