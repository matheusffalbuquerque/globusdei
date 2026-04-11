import { IsBoolean, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateModuleDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(10) description: string;
  @IsOptional() @IsString() coverUrl?: string;
  @IsOptional() @IsString() workInstructions?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsOptional() @IsNumber() order?: number;
}
