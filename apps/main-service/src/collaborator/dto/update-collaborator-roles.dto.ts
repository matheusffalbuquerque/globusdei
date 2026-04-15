import { ApiProperty } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';
import { ArrayUnique, IsArray, IsEnum } from 'class-validator';

export class UpdateCollaboratorRolesDto {
  @ApiProperty({ enum: CollaboratorRole, isArray: true })
  @IsArray()
  @ArrayUnique()
  @IsEnum(CollaboratorRole, { each: true })
  roles!: CollaboratorRole[];
}
