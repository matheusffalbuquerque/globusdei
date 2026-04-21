import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { FileVisibility } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Gera signed upload URL e cria registro File no banco.
   * Retorna { fileId, uploadUrl, publicUrl? }
   */
  async requestUpload(user: AuthenticatedUser, params: {
    fileName: string;
    mimeType: string;
    size: number;
    visibility: FileVisibility;
    context?: string;
    uploadedById?: string;
  }) {
    await this.assertCanManageOwnFiles(user);

    const { fileName, mimeType, size, visibility, context, uploadedById } = params;

    // Limites de tamanho por tipo
    const isImage = mimeType.startsWith('image/');
    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB img, 50MB docs
    if (size > maxSize) {
      throw new Error(
        `Tamanho excede o limite de ${isImage ? '10MB para imagens' : '50MB para documentos'}.`,
      );
    }

    // Gerar key organizada por contexto
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    const prefix = context || 'general';
    const key = `${prefix}/${randomUUID()}.${ext}`;

    const bucket = this.storage.getBucketName(visibility);

    // Criar registro no banco
    const file = await this.prisma.file.create({
      data: {
        key,
        bucket,
        visibility,
        originalName: fileName,
        mimeType,
        size,
        uploadedById,
        confirmed: false,
      },
    });

    // Gerar signed upload URL (10 min)
    const uploadUrl = await this.storage.generateUploadUrl(key, bucket, mimeType, 600);

    const result: {
      fileId: string;
      uploadUrl: string;
      key: string;
      publicUrl?: string;
    } = {
      fileId: file.id,
      uploadUrl,
      key,
    };

    // Se público, adicionar URL direta
    if (visibility === FileVisibility.PUBLIC) {
      result.publicUrl = this.storage.getPublicUrl(key);
    }

    return result;
  }

  /**
   * Confirma que o upload foi concluído pelo frontend.
   */
  async confirmUpload(user: AuthenticatedUser, fileId: string) {
    await this.assertCanManageFile(user, fileId);
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Arquivo não encontrado.');

    return this.prisma.file.update({
      where: { id: fileId },
      data: { confirmed: true },
    });
  }

  /**
   * Gera signed download URL para arquivo privado.
   */
  async getSignedUrl(user: AuthenticatedUser, fileId: string) {
    await this.assertCanManageFile(user, fileId);
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Arquivo não encontrado.');

    if (file.visibility === FileVisibility.PUBLIC) {
      return { url: this.storage.getPublicUrl(file.key) };
    }

    const url = await this.storage.generateDownloadUrl(file.key, file.bucket, 3600);
    return { url };
  }

  /**
   * Retorna metadados do arquivo.
   */
  async findById(user: AuthenticatedUser, fileId: string) {
    await this.assertCanManageFile(user, fileId);
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Arquivo não encontrado.');
    return file;
  }

  /**
   * Remove arquivo do R2 e deleta registro do banco.
   */
  async remove(user: AuthenticatedUser, fileId: string) {
    await this.assertCanManageFile(user, fileId);
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Arquivo não encontrado.');

    // Deletar do R2
    await this.storage.deleteObject(file.key, file.bucket);

    // Deletar do banco
    return this.prisma.file.delete({ where: { id: fileId } });
  }

  /**
   * Permite criar uploads apenas para o próprio agente autenticado da conta.
   */
  private async assertCanManageOwnFiles(user: AuthenticatedUser): Promise<void> {
    const agent = await this.prisma.agent.findFirst({
      where: {
        OR: [{ authSubject: user.sub }, { email: user.email }],
      },
      select: { id: true },
    });

    if (!agent) {
      throw new ForbiddenException(
        'Apenas o próprio agente autenticado da conta pode gerenciar arquivos.',
      );
    }
  }

  /**
   * Permite operar um arquivo somente quando o usuário é o próprio agente
   * autenticado que realizou o upload.
   */
  private async assertCanManageFile(user: AuthenticatedUser, fileId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: { id: true, uploadedById: true },
    });

    if (!file) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    if (file.uploadedById === user.sub) {
      return;
    }

    throw new ForbiddenException(
      'Apenas o agente dono do arquivo pode gerenciar este recurso.',
    );
  }
}
