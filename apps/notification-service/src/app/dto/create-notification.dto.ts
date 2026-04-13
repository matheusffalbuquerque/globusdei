import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationScope, NotificationTargetType, NotificationType } from '@prisma/client';

export class NotificationRecipientDto {
  @IsEnum(NotificationTargetType)
  targetType!: NotificationTargetType;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsUUID()
  collaboratorId?: string;

  @IsOptional()
  @IsUUID()
  empreendimentoId?: string;
}

/**
 * Generic DTO used for collaborator-authored or internal notification creation.
 */
export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsOptional()
  @IsEnum(NotificationScope)
  scope?: NotificationScope;

  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  actionUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceEntityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sourceEntityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  senderSystemLabel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationRecipientDto)
  recipients!: NotificationRecipientDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientGroups?: string[];
}
