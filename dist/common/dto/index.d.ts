export declare class CreateCompanyDto {
    nombre: string;
    nit: string;
    dbName: string;
    plan?: 'starter' | 'pro' | 'enterprise';
    contacto_email?: string;
    logo_url?: string;
}
export declare class UpdateCompanyDto {
    nombre?: string;
    status?: 'active' | 'suspended';
    plan?: 'starter' | 'pro' | 'enterprise';
    contacto_email?: string;
    logo_url?: string;
}
export declare class CreateBranchDto {
    nombre: string;
    ciudad: string;
    direccion: string;
    timezone?: string;
}
export declare class UpdateBranchDto {
    nombre?: string;
    ciudad?: string;
    direccion?: string;
    timezone?: string;
    active?: boolean;
}
export declare class AddUserDto {
    email: string;
    role: 'super_admin' | 'admin' | 'manager' | 'viewer';
    branchIndexes?: number[];
}
export declare class UpdateUserDto {
    role?: 'super_admin' | 'admin' | 'manager' | 'viewer';
    active?: boolean;
    branchIndexes?: number[];
}
export declare class CreateRadarDto {
    uid_hardware: string;
    companyId: string;
    branchIndex: number;
    nombre: string;
    ip_local: string;
    local_api_port?: number;
    firmware_version?: string;
}
export declare class UpdateRadarDto {
    nombre?: string;
    ip_local?: string;
    local_api_port?: number;
    status?: string;
    firmware_version?: string;
}
export declare class HeartbeatDto {
    uid_hardware: string;
    ip_local?: string;
    firmware_version?: string;
    local_api_port?: number;
    wifi_rssi?: number;
    heap_free?: number;
    uptime_s?: number;
    detections_total?: number;
}
export declare class IngestCountDto {
    uid_hardware: string;
    timestamp_utc: string;
    count_in: number;
    count_out: number;
}
export declare class CountQueryDto {
    companyId: string;
    branchIndex?: number;
    radarId?: string;
    from: string;
    to: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
}
export declare class CreateAlertRuleDto {
    companyId: string;
    branchIndex?: number;
    name: string;
    type: 'max_occupancy' | 'radar_offline';
    threshold?: number;
    offline_minutes?: number;
    notify_email?: boolean;
    email_recipients?: string[];
}
export declare class UpdateAlertRuleDto {
    name?: string;
    threshold?: number;
    offline_minutes?: number;
    notify_email?: boolean;
    email_recipients?: string[];
    active?: boolean;
}
export declare class RequestOtpDto {
    email: string;
}
export declare class VerifyOtpDto {
    email: string;
    code: string;
}
