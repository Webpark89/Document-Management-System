import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async uploadSignature(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('ไม่พบไฟล์รูปภาพลายเซ็น');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
    }

    // Convert image buffer to base64 with data URI prefix
    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    
    // Encrypt the signature
    const encryptedSignature = this.encryption.encrypt(base64Data);

    // Save encrypted signature in DB
    await this.prisma.user.update({
      where: { id: userId },
      data: { signature_encrypted: encryptedSignature },
    });

    // Write AuditLog
    await this.prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'Signature',
        module: 'User',
        target_id: userId,
        details: { encrypted: true },
      },
    });

    return { success: true, url: base64Data };
  }

  async getMySignatureUrl(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { signature_encrypted: true },
    });

    if (!user || !user.signature_encrypted) {
      return { url: null };
    }

    const decrypted = this.encryption.decrypt(user.signature_encrypted);
    return { url: decrypted };
  }

  async getSignatureBuffer(userId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { signature_encrypted: true },
    });

    if (!user || !user.signature_encrypted) {
      throw new NotFoundException('ไม่พบลายเซ็นของผู้ใช้นี้');
    }

    const decrypted = this.encryption.decrypt(user.signature_encrypted);
    // Parse data URI format: data:image/png;base64,...
    const matches = decrypted.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!matches) {
      // Fallback if raw base64 string
      return {
        buffer: Buffer.from(decrypted, 'base64'),
        mimeType: 'image/png',
      };
    }

    return {
      mimeType: matches[1],
      buffer: Buffer.from(matches[2], 'base64'),
    };
  }
}
