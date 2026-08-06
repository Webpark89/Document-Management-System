import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EncryptionModule } from '../common/encryption/encryption.module';

@Module({
  imports: [EncryptionModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
