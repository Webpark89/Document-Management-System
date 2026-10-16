import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [EncryptionModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
