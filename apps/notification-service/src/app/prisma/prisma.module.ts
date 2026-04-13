import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * Provides a single Prisma connection pool for the notification service.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
