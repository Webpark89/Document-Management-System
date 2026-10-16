import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { Actor, hasAny, requirePermission } from '../common/document-policy';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}
  async uploadSignature(
    userId: string,
    file: Express.Multer.File,
    actorId = userId,
  ) {
    if (
      !file ||
      file.size > 2 * 1024 * 1024 ||
      !['image/png', 'image/jpeg'].includes(file.mimetype)
    )
      throw new BadRequestException('รองรับลายเซ็น PNG/JPEG ไม่เกิน 2 MB');
    try {
      const pdf = await PDFDocument.create();
      const image =
        file.mimetype === 'image/png'
          ? await pdf.embedPng(file.buffer)
          : await pdf.embedJpg(file.buffer);
      if (image.width > 5000 || image.height > 5000)
        throw new Error('large image');
    } catch {
      throw new BadRequestException(
        'ไฟล์ลายเซ็นไม่ใช่ PNG/JPEG ที่ถูกต้อง หรือมีขนาดภาพใหญ่เกินไป',
      );
    }
    const uri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { signature_encrypted: this.encryption.encrypt(uri) },
      });
      await tx.auditLog.create({
        data: {
          user_id: actorId,
          action: 'Signature',
          module: 'User',
          target_id: userId,
          details: {
            oldState: {},
            newState: { has_signature: true },
            extra: {},
          },
        },
      });
    });
    return { success: true, url: uri };
  }
  async getMySignatureUrl(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { signature_encrypted: true },
    });
    return {
      url: user?.signature_encrypted
        ? this.encryption.decrypt(user.signature_encrypted)
        : null,
    };
  }
  async getSignatureBuffer(userId: string, actor: Actor) {
    if (
      actor.id !== userId &&
      !hasAny(actor, ['masterdata.signatures:view', 'masterdata.access:view'])
    )
      throw new ForbiddenException('ไม่มีสิทธิ์ดูลายเซ็นต้นฉบับของผู้ใช้อื่น');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { signature_encrypted: true },
    });
    if (!user?.signature_encrypted) throw new NotFoundException('ไม่พบลายเซ็น');
    const match = this.encryption
      .decrypt(user.signature_encrypted)
      .match(/^data:(image\/(?:png|jpeg));base64,(.+)$/);
    if (!match)
      throw new NotFoundException(
        'ลายเซ็นเดิมมีรูปแบบไม่รองรับ กรุณาบันทึกใหม่',
      );
    return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
  }
  async setUserSignature(userId: string, image: string | null, actor: Actor) {
    requirePermission(actor, [
      'masterdata.signatures:edit',
      'masterdata.signatures:create',
      'masterdata.access:edit',
    ]);
    const user = await this.prisma.user.findFirst({
      where: { id: userId, is_deleted: false },
    });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้');
    if (image !== null) {
      const match = image.match(/^data:(image\/(?:png|jpeg));base64,(.+)$/);
      if (!match) throw new BadRequestException('รองรับลายเซ็น PNG/JPEG');
      const buffer = Buffer.from(match[2], 'base64');
      await this.uploadSignature(
        userId,
        {
          buffer,
          size: buffer.length,
          mimetype: match[1],
        } as Express.Multer.File,
        actor.id,
      );
    } else
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { signature_encrypted: null },
        });
        await tx.auditLog.create({
          data: {
            user_id: actor.id,
            action: 'Signature',
            module: 'User',
            target_id: userId,
            details: {
              oldState: { has_signature: !!user.signature_encrypted },
              newState: { has_signature: false },
              extra: {},
            },
          },
        });
      });
    return { success: true };
  }
}
