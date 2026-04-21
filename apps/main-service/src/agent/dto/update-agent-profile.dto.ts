import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsDateString } from 'class-validator';
import { LanguageProficiency } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateAgentProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoFileId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverFileId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentDenomination?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  portfolioUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  portfolioFileId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationalityId?: string;



  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicBio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  vocationalAreaIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  skillIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  languageRecords?: { languageId: string; proficiencyLevel: LanguageProficiency }[];
}
