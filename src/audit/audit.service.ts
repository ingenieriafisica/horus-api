import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';

export interface LogAuditInput {
  companyId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async log(input: LogAuditInput): Promise<void> {
    try {
      await new this.auditModel({
        companyId: input.companyId && Types.ObjectId.isValid(input.companyId)
          ? new Types.ObjectId(input.companyId)
          : undefined,
        actorEmail: input.actorEmail ?? 'system',
        actorRole: input.actorRole ?? 'system',
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        details: input.details,
      }).save();
    } catch (err) {
      this.logger.warn(`Error guardando audit log (${input.action}): ${(err as Error).message}`);
    }
  }

  async findLogs(companyId?: string, limit = 50) {
    const filter: Record<string, unknown> = {};
    if (companyId && Types.ObjectId.isValid(companyId)) {
      filter.companyId = new Types.ObjectId(companyId);
    }
    return this.auditModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 200))
      .lean();
  }
}
