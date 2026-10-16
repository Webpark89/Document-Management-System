import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { EncryptionModule } from '../common/encryption/encryption.module';
@Module({
  imports: [
    EncryptionModule,
    MulterModule.register({
      storage: memoryStorage(), // เก็บใน RAM buffer ก่อนโยนขึ้น R2
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
      fileFilter: (_req, file, cb) => {
        // รับเฉพาะ PDF
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('รองรับเฉพาะไฟล์ PDF เท่านั้น'), false);
        }
      },
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
