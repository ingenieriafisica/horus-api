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
    role: 'admin' | 'manager' | 'viewer';
    branchIndexes?: number[];
}
export declare class UpdateUserDto {
    role?: 'admin' | 'manager' | 'viewer';
    active?: boolean;
    branchIndexes?: number[];
}
export declare class CreateCameraDto {
    uid_hardware: string;
    companyId: string;
    branchIndex: number;
    ubicacion_cam: string;
    ip_local: string;
    firmware_version?: string;
}
export declare class UpdateCameraDto {
    ubicacion_cam?: string;
    ip_local?: string;
    status?: 'active' | 'inactive' | 'error';
    firmware_version?: string;
}
export declare class HeartbeatDto {
    uid_hardware: string;
    ip_local?: string;
    firmware_version?: string;
    wifi_rssi?: number;
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
    cameraId?: string;
    from: string;
    to: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
}
export declare class RequestOtpDto {
    email: string;
}
export declare class VerifyOtpDto {
    email: string;
    code: string;
}
