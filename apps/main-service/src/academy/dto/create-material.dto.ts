import { IsString, MinLength } from 'class-validator';

export class CreateMaterialDto {
  @IsString() @MinLength(2) title: string;
  @IsString() @MinLength(5) url: string;
}
