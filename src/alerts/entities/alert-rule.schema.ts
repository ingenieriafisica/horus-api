import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertRuleDocument = AlertRule & Document;

@Schema({ timestamps: true, collection: 'alert_rules' })
export class AlertRule {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Company', index: true })
  companyId!: Types.ObjectId;

  /** Opcional: si es undefined, aplica a toda la empresa */
  @Prop()
  branchIndex?: number;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: ['max_occupancy', 'radar_offline'] })
  type!: 'max_occupancy' | 'radar_offline';

  /** Umbral de ocupación neta (count_in - count_out) para max_occupancy */
  @Prop({ default: 100 })
  threshold!: number;

  /** Minutos sin heartbeat para marcar radar offline */
  @Prop({ default: 15 })
  offline_minutes!: number;

  @Prop({ default: true })
  notify_email!: boolean;

  @Prop({ type: [String], default: [] })
  email_recipients!: string[];

  @Prop({ default: true })
  active!: boolean;
}

export const AlertRuleSchema = SchemaFactory.createForClass(AlertRule);
AlertRuleSchema.index({ companyId: 1, active: 1 });
