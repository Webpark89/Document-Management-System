import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../common/s3/s3.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private s3Service: S3Service) {}

  async uploadSignature(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('ไม่พบไฟล์รูปภาพลายเซ็น');
    }

    // Ensure it's an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
    }

    const ext = file.originalname.split('.').pop() || 'png';
    const objectKey = `signatures/${userId}.${ext}`;
    
    // Upload to S3
    await this.s3Service.uploadFile(objectKey, file.buffer, file.mimetype);
    
    // Update DB
    await this.prisma.user.update({
      where: { id: userId },
      data: { signature_image_path: objectKey },
    });

    // Write AuditLog for legal compliance
    await this.prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'Signature',
        module: 'User',
        target_id: userId,
        details: { objectKey },
      },
    });

    const signedUrl = await this.s3Service.getSignedUrl(objectKey);
    return { success: true, path: objectKey, url: signedUrl };
  }

  async getMySignatureUrl(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { signature_image_path: true },
    });

    if (!user || !user.signature_image_path) {
      return { url: null };
    }

    const signedUrl = await this.s3Service.getSignedUrl(user.signature_image_path);
    return { url: signedUrl };
  }
}
