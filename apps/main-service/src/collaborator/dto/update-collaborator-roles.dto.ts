import { ApiProperty } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';
import { IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';

export class UpdateCollaboratorRolesDto {
  @ApiProperty({ enum: CollaboratorRole, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(CollaboratorRole, { each: true })
  roles!: CollaboratorRole[];
}
