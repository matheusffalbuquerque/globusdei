import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Allows collaborator-authored notifications to be edited after creation.
 */
export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  actionUrl?: string;
}
