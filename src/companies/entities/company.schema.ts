import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ─── Camera (colección independiente) ─────────────────────────────────────────
export type CameraDocument = Camera & Document;

@Schema({ timestamps: true })
export class Camera {
  @Prop({ required: true, unique: true })
  uid_hardware!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Company' })
  companyId!: Types.ObjectId;

  /** Índice de la sede dentro del array sedes[] de Company */
  @Prop({ required: true })
  branchIndex!: number;

  @Prop({ required: true })
  ubicacion_cam!: string;

  @Prop({ required: true })
  ip_local!: string;

  @Prop({ default: 'active' })
  status!: string; // active | inactive | error

  @Prop()
  firmware_version?: string;

  @Prop()
  last_seen?: Date;
}

export const CameraSchema = SchemaFactory.createForClass(Camera);

// ─── Branch (subdocumento embebido en Company) ────────────────────────────────
@Schema({ _id: false })
export class Branch {
  @Prop({ required: true })
  nombre!: string;

  @Prop({ required: true })
  ciudad!: string;

  @Prop({ required: true })
  direccion!: string;

  @Prop()
  timezone?: string; // Ej: 'America/Bogota'

  @Prop({ default: true })
  active!: boolean;

  /** Referencias a cámaras registradas para esta sede */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Camera' }], default: [] })
  cameras!: Types.ObjectId[];
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

// ─── User (subdocumento embebido en Company) ─────────────────────────────────
@Schema({ _id: false })
export class CompanyUser {
  @Prop({ required: true })
  email!: string;

  @Prop({ required: true, enum: ['admin', 'manager', 'viewer'] })
  role!: string;

  @Prop({ default: true })
  active!: boolean;

  @Prop()
  last_login?: Date;

  /** Índices de sedes a las que tiene acceso (vacío = todas) */
  @Prop({ type: [Number], default: [] })
  branchIndexes!: number[];
}

export const CompanyUserSchema = SchemaFactory.createForClass(CompanyUser);

// ─── Company (colección principal — tenant) ───────────────────────────────────
export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true })
  nombre!: string;

  @Prop({ required: true, unique: true })
  nit!: string;

  /** Nombre lógico de la base de datos (reservado para futura migración a BD por tenant) */
  @Prop({ required: true, unique: true })
  dbName!: string;

  @Prop({ default: 'active', enum: ['active', 'suspended', 'deleted'] })
  status!: string;

  @Prop({ required: true, enum: ['starter', 'pro', 'enterprise'], default: 'starter' })
  plan!: string;

  @Prop()
  logo_url?: string;

  @Prop()
  contacto_email?: string;

  /** Sedes físicas embebidas */
  @Prop({ type: [BranchSchema], default: [] })
  sedes!: Branch[];

  /** Usuarios de la empresa embebidos */
  @Prop({ type: [CompanyUserSchema], default: [] })
  users!: CompanyUser[];
}

export const CompanySchema = SchemaFactory.createForClass(Company);

// ─── Count (colección de conteos, la más voluminosa) ─────────────────────────
export type CountDocument = Count & Document;

@Schema({
  timeseries: {
    timeField: 'timestamp',
    metaField: 'meta',
    granularity: 'seconds',
  },
  expireAfterSeconds: 60 * 60 * 24 * 365 * 3, // retención 3 años
})
export class Count {
  @Prop({ required: true })
  timestamp!: Date;

  @Prop({
    type: {
      companyId: { type: Types.ObjectId, ref: 'Company', required: true },
      cameraId: { type: Types.ObjectId, ref: 'Camera', required: true },
      branchIndex: { type: Number, required: true },
    },
    required: true,
  })
  meta!: {
    companyId: Types.ObjectId;
    cameraId: Types.ObjectId;
    branchIndex: number;
  };

  @Prop({ required: true, min: 0 })
  count_in!: number;

  @Prop({ required: true, min: 0 })
  count_out!: number;
}

export const CountSchema = SchemaFactory.createForClass(Count);
