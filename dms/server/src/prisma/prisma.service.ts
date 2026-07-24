import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || "postgresql://postgres:folk2546@localhost:5433/dms_db?schema=public",
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
