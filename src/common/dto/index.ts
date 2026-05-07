// ─────────────────────────────────────────────────────────────────────────────
// DTOs compartidos para toda la aplicación PeopleCount
// ─────────────────────────────────────────────────────────────────────────────

// ── Company ──────────────────────────────────────────────────────────────────

export class CreateCompanyDto {
  nombre!: string;
  nit!: string;
  dbName!: string;
  plan?: 'starter' | 'pro' | 'enterprise';
  contacto_email?: string;
  logo_url?: string;
}

export class UpdateCompanyDto {
  nombre?: string;
  status?: 'active' | 'suspended';
  plan?: 'starter' | 'pro' | 'enterprise';
  contacto_email?: string;
  logo_url?: string;
}

// ── Branch ───────────────────────────────────────────────────────────────────

export class CreateBranchDto {
  nombre!: string;
  ciudad!: string;
  direccion!: string;
  timezone?: string;
}

export class UpdateBranchDto {
  nombre?: string;
  ciudad?: string;
  direccion?: string;
  timezone?: string;
  active?: boolean;
}

// ── Company User ─────────────────────────────────────────────────────────────

export class AddUserDto {
  email!: string;
  role!: 'admin' | 'manager' | 'viewer';
  branchIndexes?: number[];
}

export class UpdateUserDto {
  role?: 'admin' | 'manager' | 'viewer';
  active?: boolean;
  branchIndexes?: number[];
}

// ── Camera ───────────────────────────────────────────────────────────────────

export class CreateCameraDto {
  uid_hardware!: string;
  companyId!: string;
  branchIndex!: number;
  ubicacion_cam!: string;
  ip_local!: string;
  firmware_version?: string;
}

export class UpdateCameraDto {
  ubicacion_cam?: string;
  ip_local?: string;
  status?: 'active' | 'inactive' | 'error';
  firmware_version?: string;
}

/** Payload enviado por el ESP32 */
export class HeartbeatDto {
  uid_hardware!: string;
  ip_local?: string;
  firmware_version?: string;
  wifi_rssi?: number;
}

// ── Count ─────────────────────────────────────────────────────────────────────

/** Payload que envía el ESP32 al endpoint de ingestión */
export class IngestCountDto {
  uid_hardware!: string;    // identifica el dispositivo
  timestamp_utc!: string;   // ISO 8601
  count_in!: number;
  count_out!: number;
}

/** Parámetros de consulta para el dashboard */
export class CountQueryDto {
  companyId!: string;
  branchIndex?: number;
  cameraId?: string;
  from!: string;   // ISO 8601
  to!: string;     // ISO 8601
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export class RequestOtpDto {
  email!: string;
}

export class VerifyOtpDto {
  email!: string;
  code!: string;
}
