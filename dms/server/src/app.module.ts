import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditContextInterceptor } from './common/audit-context.interceptor';
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
import { LookupsController } from './common/lookups.controller';

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
  controllers: [LookupsController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditContextInterceptor }],
})
export class AppModule {}
