import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LanguageProficiency } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * UpdateAgentLanguageRecordDto validates the language/proficiency pairs saved on an agent profile.
 */
class UpdateAgentLanguageRecordDto {
  @ApiPropertyOptional()
  @IsString()
  languageId!: string;

  @ApiPropertyOptional({ enum: LanguageProficiency })
  @IsEnum(LanguageProficiency)
  proficiencyLevel!: LanguageProficiency;
}

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
  @IsArray()
  @IsString({ each: true })
  vocationalAreaIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAgentLanguageRecordDto)
  languageRecords?: UpdateAgentLanguageRecordDto[];
}
