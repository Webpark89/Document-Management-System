import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ||
            'postgresql://postgres:folk2546@localhost:5433/dms_db?schema=public&connection_limit=50&pool_timeout=10',
        },
      },
    });
  }

  async onModuleInit() {
    const maxRetries = 5;
    const delayMs = 2000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully');
        return;
      } catch (err) {
        this.logger.warn(
          `DB connection attempt ${attempt}/${maxRetries} failed. Retrying in ${delayMs}ms...`,
        );
        if (attempt === maxRetries) {
          this.logger.error('Could not connect to database after max retries.');
          throw err;
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
}

