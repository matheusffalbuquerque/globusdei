import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FinancialEntryType, FinancialTargetType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFinancialEntryDto {
  @ApiProperty({ enum: FinancialEntryType })
  @IsEnum(FinancialEntryType)
  type!: FinancialEntryType;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ enum: FinancialTargetType })
  @IsOptional()
  @IsEnum(FinancialTargetType)
  targetType?: FinancialTargetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
}
