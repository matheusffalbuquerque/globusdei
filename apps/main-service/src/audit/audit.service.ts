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
   * Resolve actor name and email from Agent or Collaborator tables.
   * The actorId may be a DB Agent.id, Agent.authSubject, or Collaborator.id.
   */
  private async resolveActor(actorId: string): Promise<{ actorName?: string; actorEmail?: string }> {
    try {
      // Try Agent by id first
      const agentById = await this.prisma.agent.findUnique({ where: { id: actorId }, select: { name: true, email: true } });
      if (agentById) return { actorName: agentById.name, actorEmail: agentById.email };

      // Try Agent by authSubject
      const agentBySub = await this.prisma.agent.findFirst({ where: { authSubject: actorId }, select: { name: true, email: true } });
      if (agentBySub) return { actorName: agentBySub.name, actorEmail: agentBySub.email };

      // Try Collaborator by id
      const collaborator = await this.prisma.collaborator.findUnique({ where: { id: actorId }, select: { name: true, email: true } });
      if (collaborator) return { actorName: collaborator.name, actorEmail: collaborator.email };

      // Try Collaborator by authSubject
      const collaboratorBySub = await this.prisma.collaborator.findFirst({ where: { authSubject: actorId }, select: { name: true, email: true } });
      if (collaboratorBySub) return { actorName: collaboratorBySub.name, actorEmail: collaboratorBySub.email };
    } catch {
      // Non-blocking: if resolution fails, log without enrichment
    }

    return {};
  }

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

    // Auto-enrich actorName/actorEmail if not provided
    if (!opts.actorName || !opts.actorEmail) {
      const resolved = await this.resolveActor(opts.actorId);
      opts.actorName = opts.actorName ?? resolved.actorName;
      opts.actorEmail = opts.actorEmail ?? resolved.actorEmail;
    }

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
      this.logger.log(`[${opts.actionType}] Actor: ${opts.actorName ?? opts.actorId} <${opts.actorEmail ?? '?'}> - ${opts.actionDetail} - IP: ${opts.ipAddress || 'unknown'}`);
    } catch (error) {
      this.logger.error(`Critical LGPD audit drop failure:`, error);
    }
  }
}
