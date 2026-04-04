import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global Prisma Module.
 * Ensures a single shared instance of PrismaService across the entire application domain.
 * Avoids repeated instantiations of database connection pools.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
