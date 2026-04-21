import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max } from 'class-validator';
import { FileVisibility } from '@prisma/client';

export class RequestUploadDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  @Max(52428800) // 50MB
  size: number;

  @IsEnum(FileVisibility)
  @IsOptional()
  visibility?: FileVisibility = FileVisibility.PUBLIC;

  /** Contexto de uso: "agent-photo", "agent-cover", "empreendimento-logo", etc. */
  @IsString()
  @IsOptional()
  context?: string;
}
