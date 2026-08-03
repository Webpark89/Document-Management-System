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

    return { success: true, path: objectKey };
  }
}
