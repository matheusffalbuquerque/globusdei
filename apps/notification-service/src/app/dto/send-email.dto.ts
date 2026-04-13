import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { NotificationTargetType } from '@prisma/client';

/**
 * Email dispatch request available to collaborators.
 */
export class SendEmailDto {
  @IsEnum(NotificationTargetType)
  targetType!: NotificationTargetType;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsUUID()
  empreendimentoId?: string;

  @IsString()
  @MaxLength(160)
  subject!: string;

  @IsString()
  message!: string;
}
