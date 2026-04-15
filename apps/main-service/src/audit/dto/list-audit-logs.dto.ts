import { IsDateString, IsEnum, IsOptional, IsString, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditType } from '../audit.service';

export class ListAuditLogsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  actorName?: string;

  @IsOptional()
  @IsEnum(AuditType)
  actionType?: AuditType;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
