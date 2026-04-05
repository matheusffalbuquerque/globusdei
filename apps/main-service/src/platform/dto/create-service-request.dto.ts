import { ApiProperty } from '@nestjs/swagger';
import { ServiceRequestCategory } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({ enum: ServiceRequestCategory })
  @IsEnum(ServiceRequestCategory)
  category!: ServiceRequestCategory;

  @ApiProperty()
  @IsString()
  description!: string;
}
