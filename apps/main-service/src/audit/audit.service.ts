import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum AuditType {
  SECURITY = 'SECURITY',
  TECHNICAL = 'TECHNICAL',
  AUDIT = 'AUDIT',
}

/**
 * Service responsible for recording critical operations directly mapped to the
 * LGPD constraints required by the Reviewer Skill/Documentation rule.
 * Any component touching PII (Personally Identifiable Information) MUST trigger a log.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an audit log enforcing LGPD accountability.
   * 
   * @param actorId UUID of the user/system conducting the action
   * @param actionType The category of the log for dashboard filtration
   * @param actionDetail Highly descriptive string of what occurred
   * @param ipAddress IP boundary string, optional
   */
  async logAction(actorId: string, actionType: AuditType, actionDetail: string, ipAddress?: string): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          actionType,
          actionDetail,
          ipAddress,
        },
      });
      // Simultaneous fast-log output to stdout for external collectors like Kibana
      this.logger.log(`[${actionType}] Actor: ${actorId} - ${actionDetail} - IP: ${ipAddress || 'unknown'}`);
    } catch (error) {
      // Intentionally swallowing database save faults during auditing to not break user runtime,
      // but escalating to fatal system output.
      this.logger.error(`Critical LGPD audit drop failure:`, error);
    }
  }
}
