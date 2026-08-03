import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client | null = null;
  private readonly bucket: string = 'dms-bucket';
  private readonly localUploadDir: string;

  constructor(private config: ConfigService) {
    this.localUploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }

    const endpoint = this.config.get<string>('R2_ENDPOINT');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    const bucket = this.config.get<string>('R2_BUCKET_NAME');

    if (endpoint && accessKeyId && secretAccessKey && bucket) {
      this.bucket = bucket;
      this.client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('S3Service initialized with Cloudflare R2 / S3 storage');
    } else {
      this.logger.log('R2 credentials not set — S3Service running with Local Disk Storage fallback (./uploads)');
    }
  }

  private getLocalFilePath(key: string): string {
    let cleanKey = key.replace(/\\/g, '/');
    if (cleanKey.startsWith('/')) {
      cleanKey = cleanKey.substring(1);
    }
    if (cleanKey.startsWith('uploads/')) {
      cleanKey = cleanKey.substring(8);
    }
    const fullPath = path.resolve(this.localUploadDir, cleanKey);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return fullPath;
  }

  /**
   * อัปโหลดไฟล์ขึ้น R2 หรือ Local Storage
   */
  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    if (this.client) {
      try {
        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
          }),
        );
        this.logger.log(`Uploaded to R2: ${key}`);
        return;
      } catch (err) {
        this.logger.warn(`R2 upload failed for ${key}, falling back to local disk: ${err.message}`);
      }
    }

    // Local Disk Fallback
    const localPath = this.getLocalFilePath(key);
    await fs.promises.writeFile(localPath, body);
    this.logger.log(`Uploaded to Local Storage: ${localPath}`);
  }

  /**
   * ดาวน์โหลดไฟล์มาเป็น Buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    if (this.client) {
      try {
        const response = await this.client.send(
          new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        );
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } catch (err) {
        this.logger.warn(`R2 download failed for ${key}, trying local storage fallback: ${err.message}`);
      }
    }

    // Local Disk Fallback
    const localPath = this.getLocalFilePath(key);
    if (!fs.existsSync(localPath)) {
      throw new Error(`File not found in local storage: ${key}`);
    }
    return await fs.promises.readFile(localPath);
  }

  /**
   * สร้าง Signed URL หรือ URL สำหรับแสดงผลไฟล์
   */
  async getSignedUrl(key: string, expiresIn = 900): Promise<string> {
    if (this.client) {
      try {
        const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
        return await getS3SignedUrl(this.client, command, { expiresIn });
      } catch (err) {
        this.logger.warn(`Failed to get S3 signed URL, returning local API path: ${err.message}`);
      }
    }

    // Return local static / API route URL
    return `/api/documents/file/${encodeURIComponent(key)}`;
  }

  /**
   * ลบไฟล์ออกจาก Storage
   */
  async deleteFile(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
        );
        this.logger.log(`Deleted from R2: ${key}`);
      } catch (err) {
        this.logger.warn(`R2 delete failed: ${key}`, err);
      }
    }

    const localPath = this.getLocalFilePath(key);
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath).catch(() => {});
      this.logger.log(`Deleted from Local Storage: ${localPath}`);
    }
  }
}
