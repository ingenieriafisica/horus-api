import { Model, Types } from 'mongoose';
import { AuditLogDocument } from './audit-log.schema';
export interface LogAuditInput {
    companyId?: string;
    actorEmail?: string;
    actorRole?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
}
export declare class AuditService {
    private readonly auditModel;
    private readonly logger;
    constructor(auditModel: Model<AuditLogDocument>);
    log(input: LogAuditInput): Promise<void>;
    findLogs(companyId?: string, limit?: number): Promise<(import("mongoose").FlattenMaps<AuditLogDocument> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
