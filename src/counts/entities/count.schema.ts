import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CountDocument = Count & Document;

@Schema({
  timeseries: {
    timeField: 'timestamp',
    metaField: 'meta',
    granularity: 'seconds',
  },
  expireAfterSeconds: 60 * 60 * 24 * 365 * 3,
})
export class Count {
  @Prop({ required: true })
  timestamp!: Date;

  @Prop({
    type: {
      companyId:   { type: Types.ObjectId, ref: 'Company', required: true },
      radarId:     { type: Types.ObjectId, ref: 'Radar',   required: true },
      branchIndex: { type: Number, required: true },
    },
    required: true,
  })
  meta!: {
    companyId:   Types.ObjectId;
    radarId:     Types.ObjectId;
    branchIndex: number;
  };

  @Prop({ required: true, min: 0, default: 0 })
  count_in!: number;

  @Prop({ required: true, min: 0, default: 0 })
  count_out!: number;
}

export const CountSchema = SchemaFactory.createForClass(Count);

export interface CountPoint {
  timestamp: string;
  count_in: number;
  count_out: number;
}

export interface CountMetadata {
  total: number;
  period: 'hour' | 'day' | 'week' | 'month';
}

export interface CountResponseDto {
  data: CountPoint[];
  metadata: CountMetadata;
}
