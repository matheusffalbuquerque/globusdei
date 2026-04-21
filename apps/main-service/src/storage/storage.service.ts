import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly publicBucket: string;
  private readonly privateBucket: string;
  private readonly publicUrl: string;

  constructor(private config: ConfigService) {
    const accountId = this.config.getOrThrow<string>('R2_ACCOUNT_ID');

    this.publicBucket = this.config.get<string>('R2_BUCKET_PUBLIC') || 'globusdei-files';
    this.privateBucket = this.config.get<string>('R2_BUCKET_PRIVATE') || 'globusdei-private';
    this.publicUrl = this.config.get<string>('R2_PUBLIC_URL') || '';

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  getBucketName(visibility: 'PUBLIC' | 'PRIVATE'): string {
    return visibility === 'PUBLIC' ? this.publicBucket : this.privateBucket;
  }

  /**
   * Gera signed URL para upload (PUT) direto do frontend.
   */
  async generateUploadUrl(
    key: string,
    bucket: string,
    contentType: string,
    expiresInSeconds = 600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Gera signed URL para download (GET) de arquivo privado.
   */
  async generateDownloadUrl(
    key: string,
    bucket: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Retorna a URL pública direta (para bucket público).
   */
  getPublicUrl(key: string): string {
    const normalizedKey = key.replace(/^\/+/, '');
    return `${this.getPublicBaseUrl()}/${normalizedKey}`;
  }

  /**
   * Normaliza URLs antigas que apontavam para o endpoint S3/API do R2.
   */
  normalizePublicUrl(url?: string | null): string | undefined {
    if (!url) {
      return undefined;
    }

    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('.r2.cloudflarestorage.com')) {
        return url;
      }

      let key = parsed.pathname.replace(/^\/+/, '');
      const bucketPrefix = `${this.publicBucket}/`;
      if (key.startsWith(bucketPrefix)) {
        key = key.slice(bucketPrefix.length);
      }

      return this.getPublicUrl(key);
    } catch {
      return url;
    }
  }

  private getPublicBaseUrl(): string {
    const configured = this.publicUrl.trim().replace(/\/+$/, '');
    if (!configured || configured.includes('.r2.cloudflarestorage.com')) {
      return `https://${this.publicBucket}.r2.dev`;
    }

    return configured;
  }

  /**
   * Remove arquivo do R2.
   */
  async deleteObject(key: string, bucket: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.client.send(command);
  }
}
