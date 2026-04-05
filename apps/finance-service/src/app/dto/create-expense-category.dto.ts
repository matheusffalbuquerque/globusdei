import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FinancialEntryType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateExpenseCategoryDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: FinancialEntryType })
  @IsOptional()
  @IsEnum(FinancialEntryType)
  entryType?: FinancialEntryType;
}
