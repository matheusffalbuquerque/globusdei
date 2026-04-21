import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireRealmRoles } from '../auth/role.decorators';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { FileService } from './file.service';
import { RequestUploadDto } from './dto/request-upload.dto';
import { FileVisibility } from '@prisma/client';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /** Gera signed upload URL e registra o arquivo no banco */
  @Post('upload-url')
  requestUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestUploadDto,
  ) {
    return this.fileService.requestUpload(user, {
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      size: dto.size,
      visibility: dto.visibility || FileVisibility.PUBLIC,
      context: dto.context,
      uploadedById: user.sub,
    });
  }

  /** Confirma que o upload foi concluído */
  @Post(':id/confirm')
  confirmUpload(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.fileService.confirmUpload(user, id);
  }

  /** Gera signed download URL (privado) ou retorna URL pública */
  @Get(':id/signed-url')
  getSignedUrl(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.fileService.getSignedUrl(user, id);
  }

  /** Retorna metadados do arquivo */
  @Get(':id')
  findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.fileService.findById(user, id);
  }

  /** Remove arquivo do R2 e do banco */
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.fileService.remove(user, id);
  }
}
