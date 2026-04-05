import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmpreendimentoCategory, EmpreendimentoType, NeedType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEmpreendimentoDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsDateString()
  establishedDate!: string;

  @ApiProperty({ enum: EmpreendimentoType })
  @IsEnum(EmpreendimentoType)
  type!: EmpreendimentoType;

  @ApiProperty({ enum: EmpreendimentoCategory })
  @IsEnum(EmpreendimentoCategory)
  category!: EmpreendimentoCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actuationRegions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyExpenses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  incomeSources?: string;

  @ApiPropertyOptional({ enum: NeedType })
  @IsOptional()
  @IsEnum(NeedType)
  needType?: NeedType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  receivesInvestments?: boolean;
}
