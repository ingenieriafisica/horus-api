import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'Company', index: true })
  companyId?: Types.ObjectId;

  @Prop({ required: true })
  actorEmail!: string;

  @Prop({ required: true })
  actorRole!: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  resource!: string;

  @Prop()
  resourceId?: string;

  @Prop({ type: Object })
  details?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ companyId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
