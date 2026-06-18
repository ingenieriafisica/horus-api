import {
  IsString, IsOptional, IsNumber, IsIn, IsEmail,
  IsBoolean, IsInt, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Company ───────────────────────────────────────────────────────────────────

export class CreateCompanyDto {
  @IsString() nombre!: string;
  @IsString() nit!: string;
  @IsString() dbName!: string;
  @IsOptional() @IsIn(['starter', 'pro', 'enterprise']) plan?: 'starter' | 'pro' | 'enterprise';
  @IsOptional() @IsEmail() contacto_email?: string;
  @IsOptional() @IsString() logo_url?: string;
}

export class UpdateCompanyDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsIn(['active', 'suspended']) status?: 'active' | 'suspended';
  @IsOptional() @IsIn(['starter', 'pro', 'enterprise']) plan?: 'starter' | 'pro' | 'enterprise';
  @IsOptional() @IsEmail() contacto_email?: string;
  @IsOptional() @IsString() logo_url?: string;
}

// ── Branch ────────────────────────────────────────────────────────────────────

export class CreateBranchDto {
  @IsString() nombre!: string;
  @IsString() ciudad!: string;
  @IsString() direccion!: string;
  @IsOptional() @IsString() timezone?: string;
}

export class UpdateBranchDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() ciudad?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

// ── Company User ──────────────────────────────────────────────────────────────

export class AddUserDto {
  @IsEmail() email!: string;
  @IsIn(['admin', 'manager', 'viewer']) role!: 'admin' | 'manager' | 'viewer';
  @IsOptional() @IsNumber({}, { each: true }) branchIndexes?: number[];
}

export class UpdateUserDto {
  @IsOptional() @IsIn(['admin', 'manager', 'viewer']) role?: 'admin' | 'manager' | 'viewer';
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsNumber({}, { each: true }) branchIndexes?: number[];
}

// ── Radar ─────────────────────────────────────────────────────────────────────

export class CreateRadarDto {
  @IsString() uid_hardware!: string;
  @IsString() companyId!: string;
  @IsInt() @Min(0) @Type(() => Number) branchIndex!: number;
  @IsString() nombre!: string;
  @IsString() ip_local!: string;
  @IsOptional() @IsInt() @Min(1) @Max(65535) @Type(() => Number) local_api_port?: number;
  @IsOptional() @IsString() firmware_version?: string;
}

export class UpdateRadarDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() ip_local?: string;
  @IsOptional() @IsInt() @Min(1) @Max(65535) @Type(() => Number) local_api_port?: number;
  @IsOptional() @IsIn(['active', 'inactive', 'error', 'offline']) status?: string;
  @IsOptional() @IsString() firmware_version?: string;
}

/** Payload enviado por el ESP32 en cada heartbeat */
export class HeartbeatDto {
  @IsString() uid_hardware!: string;
  @IsOptional() @IsString() ip_local?: string;
  @IsOptional() @IsString() firmware_version?: string;
  @IsOptional() @IsInt() @Min(1) @Max(65535) @Type(() => Number) local_api_port?: number;
  @IsOptional() @IsNumber() @Type(() => Number) wifi_rssi?: number;
  @IsOptional() @IsNumber() @Type(() => Number) heap_free?: number;
  @IsOptional() @IsNumber() @Type(() => Number) uptime_s?: number;
  @IsOptional() @IsNumber() @Type(() => Number) detections_total?: number;
}

// ── Count ─────────────────────────────────────────────────────────────────────

export class IngestCountDto {
  @IsString() uid_hardware!: string;
  @IsString() timestamp_utc!: string;
  @IsNumber() @Min(0) @Type(() => Number) count_in!: number;
  @IsNumber() @Min(0) @Type(() => Number) count_out!: number;
}

export class CountQueryDto {
  @IsString() companyId!: string;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) branchIndex?: number;
  @IsOptional() @IsString() radarId?: string;
  @IsString() from!: string;
  @IsString() to!: string;
  @IsOptional() @IsIn(['hour', 'day', 'week', 'month']) granularity?: 'hour' | 'day' | 'week' | 'month';
}

// ── Auth ──────────────────────────────────────────────────────────────────────
// Nota: los DTOs de auth usan su propio archivo src/auth/dto/auth.dto.ts
// Estos están aquí solo como referencia para importaciones legacy.

export class RequestOtpDto {
  email!: string;
}

export class VerifyOtpDto {
  email!: string;
  code!: string;
}
