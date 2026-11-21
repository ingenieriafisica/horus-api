import {
  IsString, IsOptional, IsNumber, IsIn, IsEmail,
  IsBoolean, IsInt, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Company ───────────────────────────────────────────────────────────────────

export class CreateCompanyDto {
  @ApiProperty({ example: 'Horus Retail S.A.S.' })
  @IsString() nombre!: string;

  @ApiProperty({ example: '900123456-7' })
  @IsString() nit!: string;

  @ApiProperty({ example: 'horus_retail' })
  @IsString() dbName!: string;

  @ApiPropertyOptional({ enum: ['starter', 'pro', 'enterprise'] })
  @IsOptional() @IsIn(['starter', 'pro', 'enterprise']) plan?: 'starter' | 'pro' | 'enterprise';

  @ApiPropertyOptional({ example: 'contacto@empresa.com' })
  @IsOptional() @IsEmail() contacto_email?: string;

  @ApiPropertyOptional({ example: 'https://cdn.horus.co/logo.png' })
  @IsOptional() @IsString() logo_url?: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Horus Retail S.A.S.' })
  @IsOptional() @IsString() nombre?: string;

  @ApiPropertyOptional({ enum: ['active', 'suspended'] })
  @IsOptional() @IsIn(['active', 'suspended']) status?: 'active' | 'suspended';

  @ApiPropertyOptional({ enum: ['starter', 'pro', 'enterprise'] })
  @IsOptional() @IsIn(['starter', 'pro', 'enterprise']) plan?: 'starter' | 'pro' | 'enterprise';

  @ApiPropertyOptional({ example: 'contacto@empresa.com' })
  @IsOptional() @IsEmail() contacto_email?: string;

  @ApiPropertyOptional({ example: 'https://cdn.horus.co/logo.png' })
  @IsOptional() @IsString() logo_url?: string;
}

// ── Branch ────────────────────────────────────────────────────────────────────

export class CreateBranchDto {
  @ApiProperty({ example: 'Sede Principal' })
  @IsString() nombre!: string;

  @ApiProperty({ example: 'Medellín' })
  @IsString() ciudad!: string;

  @ApiProperty({ example: 'Cra 43A # 1-50' })
  @IsString() direccion!: string;

  @ApiPropertyOptional({ example: 'America/Bogota' })
  @IsOptional() @IsString() timezone?: string;
}

export class UpdateBranchDto {
  @ApiPropertyOptional({ example: 'Sede Principal' })
  @IsOptional() @IsString() nombre?: string;

  @ApiPropertyOptional({ example: 'Medellín' })
  @IsOptional() @IsString() ciudad?: string;

  @ApiPropertyOptional({ example: 'Cra 43A # 1-50' })
  @IsOptional() @IsString() direccion?: string;

  @ApiPropertyOptional({ example: 'America/Bogota' })
  @IsOptional() @IsString() timezone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() active?: boolean;
}

// ── Company User ──────────────────────────────────────────────────────────────

export class AddUserDto {
  @ApiProperty({ example: 'usuario@empresa.com' })
  @IsEmail() email!: string;

  @ApiProperty({ enum: ['super_admin', 'admin', 'manager', 'viewer'] })
  @IsIn(['super_admin', 'admin', 'manager', 'viewer']) role!: 'super_admin' | 'admin' | 'manager' | 'viewer';

  @ApiPropertyOptional({ type: [Number], example: [0, 1] })
  @IsOptional() @IsNumber({}, { each: true }) branchIndexes?: number[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: ['super_admin', 'admin', 'manager', 'viewer'] })
  @IsOptional() @IsIn(['super_admin', 'admin', 'manager', 'viewer']) role?: 'super_admin' | 'admin' | 'manager' | 'viewer';

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() active?: boolean;

  @ApiPropertyOptional({ type: [Number], example: [0] })
  @IsOptional() @IsNumber({}, { each: true }) branchIndexes?: number[];
}

// ── Radar ─────────────────────────────────────────────────────────────────────

export class CreateRadarDto {
  @ApiProperty({ example: 'ESP32-AA11BB22' })
  @IsString() uid_hardware!: string;

  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsString() companyId!: string;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt() @Min(0) @Type(() => Number) branchIndex!: number;

  @ApiProperty({ example: 'Entrada Principal' })
  @IsString() nombre!: string;

  @ApiProperty({ example: '192.168.1.50' })
  @IsString() ip_local!: string;

  @ApiPropertyOptional({ example: 80, minimum: 1, maximum: 65535 })
  @IsOptional() @IsInt() @Min(1) @Max(65535) @Type(() => Number) local_api_port?: number;

  @ApiPropertyOptional({ example: '1.2.0' })
  @IsOptional() @IsString() firmware_version?: string;
}

export class UpdateRadarDto {
  @ApiPropertyOptional({ example: 'Entrada Principal' })
  @IsOptional() @IsString() nombre?: string;

  @ApiPropertyOptional({ example: '192.168.1.50' })
  @IsOptional() @IsString() ip_local?: string;

  @ApiPropertyOptional({ example: 80, minimum: 1, maximum: 65535 })
  @IsOptional() @IsInt() @Min(1) @Max(65535) @Type(() => Number) local_api_port?: number;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'error', 'offline'] })
  @IsOptional() @IsIn(['active', 'inactive', 'error', 'offline']) status?: string;

  @ApiPropertyOptional({ example: '1.2.1' })
  @IsOptional() @IsString() firmware_version?: string;
}

/** Payload enviado por el ESP32 en cada heartbeat */
export class HeartbeatDto {
  @ApiProperty({ example: 'ESP32-AA11BB22' })
  @IsString() uid_hardware!: string;

  @ApiPropertyOptional({ example: '192.168.1.50' })
  @IsOptional() @IsString() ip_local?: string;

  @ApiPropertyOptional({ example: '1.2.0' })
  @IsOptional() @IsString() firmware_version?: string;

  @ApiPropertyOptional({ example: 80, minimum: 1, maximum: 65535 })
  @IsOptional() @IsInt() @Min(1) @Max(65535) @Type(() => Number) local_api_port?: number;

  @ApiPropertyOptional({ example: -58 })
  @IsOptional() @IsNumber() @Type(() => Number) wifi_rssi?: number;

  @ApiPropertyOptional({ example: 145000 })
  @IsOptional() @IsNumber() @Type(() => Number) heap_free?: number;

  @ApiPropertyOptional({ example: 86400 })
  @IsOptional() @IsNumber() @Type(() => Number) uptime_s?: number;

  @ApiPropertyOptional({ example: 342 })
  @IsOptional() @IsNumber() @Type(() => Number) detections_total?: number;
}

// ── Count ─────────────────────────────────────────────────────────────────────

export class IngestCountDto {
  @ApiProperty({ example: 'ESP32-AA11BB22' })
  @IsString() uid_hardware!: string;

  @ApiProperty({ example: '2026-07-24T15:00:00.000Z' })
  @IsString() timestamp_utc!: string;

  @ApiProperty({ example: 12, minimum: 0 })
  @IsNumber() @Min(0) @Type(() => Number) count_in!: number;

  @ApiProperty({ example: 8, minimum: 0 })
  @IsNumber() @Min(0) @Type(() => Number) count_out!: number;
}

export class CountQueryDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsString() companyId!: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) branchIndex?: number;

  @ApiPropertyOptional({ example: '665f1a2b3c4d5e6f7a8b9c0e' })
  @IsOptional() @IsString() radarId?: string;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  @IsString() from!: string;

  @ApiProperty({ example: '2026-07-24T23:59:59.999Z' })
  @IsString() to!: string;

  @ApiPropertyOptional({ enum: ['hour', 'day', 'week', 'month'] })
  @IsOptional() @IsIn(['hour', 'day', 'week', 'month']) granularity?: 'hour' | 'day' | 'week' | 'month';
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export class CreateAlertRuleDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsString() companyId!: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) branchIndex?: number;

  @ApiProperty({ example: 'Aforo máximo sede principal' })
  @IsString() name!: string;

  @ApiProperty({ enum: ['max_occupancy', 'radar_offline'] })
  @IsIn(['max_occupancy', 'radar_offline']) type!: 'max_occupancy' | 'radar_offline';

  @ApiPropertyOptional({ example: 100, minimum: 1 })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) threshold?: number;

  @ApiPropertyOptional({ example: 15, minimum: 1 })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) offline_minutes?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() notify_email?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['admin@empresa.com'] })
  @IsOptional() @IsEmail({}, { each: true }) email_recipients?: string[];
}

export class UpdateAlertRuleDto {
  @ApiPropertyOptional({ example: 'Aforo máximo actualizado' })
  @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional({ example: 120, minimum: 1 })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) threshold?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) offline_minutes?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() notify_email?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsEmail({}, { each: true }) email_recipients?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() active?: boolean;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
// Nota: los DTOs de auth usan su propio archivo src/auth/dto/auth.dto.ts
// Estos están aquí solo como referencia para importaciones legacy.

export class RequestOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: '123456' })
  code!: string;
}
