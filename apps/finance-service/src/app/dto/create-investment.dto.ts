import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FinancialTargetType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvestmentDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: FinancialTargetType })
  @IsEnum(FinancialTargetType)
  targetType!: FinancialTargetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetId?: string;
}
