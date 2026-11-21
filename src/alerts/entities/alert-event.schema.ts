import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertEventDocument = AlertEvent & Document;

@Schema({ timestamps: true, collection: 'alert_events' })
export class AlertEvent {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Company', index: true })
  companyId!: Types.ObjectId;

  @Prop()
  branchIndex?: number;

  @Prop({ type: Types.ObjectId, ref: 'Radar' })
  radarId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AlertRule' })
  ruleId?: Types.ObjectId;

  @Prop({ required: true, enum: ['max_occupancy', 'radar_offline'] })
  type!: 'max_occupancy' | 'radar_offline';

  @Prop({ required: true, enum: ['warning', 'critical'], default: 'warning' })
  severity!: 'warning' | 'critical';

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop()
  value?: number;

  @Prop()
  threshold?: number;

  @Prop({ default: false })
  acknowledged!: boolean;

  @Prop()
  acknowledged_by?: string;

  @Prop()
  acknowledged_at?: Date;
}

export const AlertEventSchema = SchemaFactory.createForClass(AlertEvent);
AlertEventSchema.index({ companyId: 1, createdAt: -1 });
AlertEventSchema.index({ companyId: 1, acknowledged: 1, createdAt: -1 });
