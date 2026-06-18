import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RadarDocument = Radar & Document;

@Schema({ timestamps: true, collection: 'radars' })
export class Radar {
  @Prop({ required: true })
  uid_hardware!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Company' })
  companyId!: Types.ObjectId;

  @Prop({ required: true })
  branchIndex!: number;

  /** Nombre descriptivo del radar, ej: "Entrada Principal - Piso 1" */
  @Prop({ required: true })
  nombre!: string;

  /** Última IP local reportada por el ESP32 en el heartbeat */
  @Prop({ required: true })
  ip_local!: string;

  /** Puerto del servidor HTTP del ESP32 (por defecto 80) */
  @Prop({ default: 80 })
  local_api_port!: number;

  @Prop({ default: 'active', enum: ['active', 'inactive', 'error', 'offline'] })
  status!: string;

  @Prop()
  firmware_version?: string;

  @Prop()
  last_seen?: Date;

  /** Datos del último heartbeat enviado por el ESP32 */
  @Prop({ type: Object })
  last_heartbeat?: {
    wifi_rssi?: number;
    heap_free?: number;
    uptime_s?: number;
    detections_total?: number;
  };
}

export const RadarSchema = SchemaFactory.createForClass(Radar);

// Índices compuestos para aislamiento multitenant y performance
// companyId siempre como prefijo para que el planner lo use como filtro principal
RadarSchema.index({ companyId: 1, uid_hardware: 1 }, { unique: true });
RadarSchema.index({ companyId: 1, branchIndex: 1 });
RadarSchema.index({ companyId: 1, status: 1 });
RadarSchema.index({ uid_hardware: 1 });  // lookups rápidos desde ESP32 heartbeat/ingest
