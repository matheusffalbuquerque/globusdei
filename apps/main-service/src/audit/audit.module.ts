import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Global Audit Module for LGPD tracking.
 * Provides the AuditService application-wide to log sensitive actions without tight coupling.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
