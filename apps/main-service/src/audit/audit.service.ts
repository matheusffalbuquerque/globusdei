import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum AuditType {
  SECURITY = 'SECURITY',
  TECHNICAL = 'TECHNICAL',
  AUDIT = 'AUDIT',
}

export interface AuditLogOptions {
  actorId: string;
  actorName?: string;
  actorEmail?: string;
  actionType: AuditType;
  actionDetail: string;
  entity?: string;
  ipAddress?: string;
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
  async logAction(actorId: string, actionType: AuditType, actionDetail: string, ipAddress?: string): Promise<void>;
  async logAction(options: AuditLogOptions): Promise<void>;
  async logAction(
    actorIdOrOptions: string | AuditLogOptions,
    actionType?: AuditType,
    actionDetail?: string,
    ipAddress?: string,
  ): Promise<void> {
    const opts: AuditLogOptions =
      typeof actorIdOrOptions === 'string'
        ? { actorId: actorIdOrOptions, actionType: actionType!, actionDetail: actionDetail!, ipAddress }
        : actorIdOrOptions;

    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: opts.actorId,
          actorName: opts.actorName,
          actorEmail: opts.actorEmail,
          actionType: opts.actionType,
          actionDetail: opts.actionDetail,
          entity: opts.entity,
          ipAddress: opts.ipAddress,
        },
      });
      this.logger.log(`[${opts.actionType}] Actor: ${opts.actorId} - ${opts.actionDetail} - IP: ${opts.ipAddress || 'unknown'}`);
    } catch (error) {
      this.logger.error(`Critical LGPD audit drop failure:`, error);
    }
  }
}
