import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { NotificationTargetType } from '@prisma/client';

/**
 * Supports collaborator-authored in-app messages to agents or initiatives.
 */
export class SendDirectMessageDto {
  @IsEnum(NotificationTargetType)
  targetType!: NotificationTargetType;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsUUID()
  empreendimentoId?: string;

  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  actionUrl?: string;
}
