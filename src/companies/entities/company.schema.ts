import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
  timezone?: string;

  @Prop({ default: true })
  active!: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Radar' }], default: [] })
  radars!: Types.ObjectId[];
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

  @Prop({ type: [BranchSchema], default: [] })
  sedes!: Branch[];

  @Prop({ type: [CompanyUserSchema], default: [] })
  users!: CompanyUser[];
}

export const CompanySchema = SchemaFactory.createForClass(Company);

// Índices para búsquedas rápidas
CompanySchema.index({ status: 1 });
CompanySchema.index({ 'users.email': 1 });         // lookup por email (flujo OTP)
CompanySchema.index({ 'users.email': 1, status: 1 }); // compound: email activo
