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

  /**
   * Metadatos de discriminación del conteo. Permiten segmentar los conteos por:
   *   • empresa    → meta.companyId   (multitenancy)
   *   • sede       → meta.branchIndex (índice de la sede dentro de la empresa)
   *   • dispositivo→ meta.radarId     (radar ESP32 que generó el evento)
   * Es el metaField de la colección de series temporales.
   */
  @Prop({
    type: {
      companyId:   { type: Types.ObjectId, ref: 'Company', required: true },
      radarId:     { type: Types.ObjectId, ref: 'Radar',   required: true },
      branchIndex: { type: Number, required: true },
    },
    required: true,
    _id: false,
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

// ── Índices secundarios para consultas discriminadas ───────────────────────────
// MongoDB 6.0+ admite índices secundarios sobre subcampos de `meta` + el timeField
// en colecciones de series temporales. Uno por cada eje de discriminación; todos
// llevan companyId como prefijo para garantizar el aislamiento por tenant.
CountSchema.index({ 'meta.companyId': 1, timestamp: 1 });                          // por empresa
CountSchema.index({ 'meta.companyId': 1, 'meta.branchIndex': 1, timestamp: 1 });   // por sede
CountSchema.index({ 'meta.companyId': 1, 'meta.radarId': 1, timestamp: 1 });       // por dispositivo

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
