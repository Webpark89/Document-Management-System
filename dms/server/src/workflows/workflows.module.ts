import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [EncryptionModule, DocumentsModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
})
export class WorkflowsModule {}
