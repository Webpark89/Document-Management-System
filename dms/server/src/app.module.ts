import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FoldersModule } from './folders/folders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['server/.env', '.env', '../server/.env'],
    }),
    PrismaModule,
    AuthModule,
    DocumentsModule,
    WorkflowsModule,
    AdminModule,
    NotificationsModule,
    UsersModule,
    DashboardModule,
    FoldersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
