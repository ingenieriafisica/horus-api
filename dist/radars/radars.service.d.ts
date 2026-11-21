import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { RadarDocument } from './entities/radar.schema';
import { CompaniesService } from '../companies/companies.service';
import { AuditService } from '../audit/audit.service';
import { CreateRadarDto, UpdateRadarDto, HeartbeatDto } from '../common/dto';
export declare class RadarsService {
    private readonly radarModel;
    private readonly companiesService;
    private readonly auditService;
    private readonly redis;
    private readonly logger;
    constructor(radarModel: Model<RadarDocument>, companiesService: CompaniesService, auditService: AuditService, redis: Redis);
    create(dto: CreateRadarDto, actor?: {
        email?: string;
        role?: string;
    }): Promise<Record<string, unknown>>;
    rotateKey(id: string, companyId: string, actor?: {
        email?: string;
        role?: string;
    }): Promise<{
        device_key: string;
    }>;
    findByCompany(companyId: string, user?: {
        role?: string;
        branchIndexes?: number[];
    }): Promise<RadarDocument[]>;
    findByBranch(companyId: string, branchIndex: number): Promise<RadarDocument[]>;
    findById(id: string, companyId?: string, role?: string): Promise<RadarDocument>;
    findByHardwareUid(uid: string): Promise<RadarDocument | null>;
    update(id: string, dto: UpdateRadarDto, companyId: string, role?: string): Promise<RadarDocument>;
    deactivate(id: string, companyId: string, actor?: {
        email?: string;
        role?: string;
    }): Promise<{
        message: string;
    }>;
    heartbeat(dto: HeartbeatDto, bearerToken?: string): Promise<{
        status: string;
    }>;
    getStatusSummary(companyId: string): Promise<any>;
    validateDevice(uid_hardware: string, bearerToken?: string, allowOfflineRecovery?: boolean): Promise<RadarDocument>;
    probeRealtime(radarId: string, companyId: string, role?: string): Promise<{
        source: string;
        radar: {
            ip_local: string;
            status: string;
            nombre: string;
            presence: boolean | null;
            detections: number | null;
            lastDetection: number | null;
            wifi_rssi: number | null;
            heap_free: number | null;
            uptime_s: number | null;
            last_seen?: Date | null;
        };
    }>;
    probeStats(radarId: string, companyId: string, role?: string): Promise<{
        source: string;
        data: {
            presence: boolean | null;
            detections: number | null;
            lastDetection: number | null;
            wifi_rssi: number | null;
            heap_free: number | null;
            uptime_s: number | null;
            last_seen?: Date | null;
        };
    }>;
    probeHealth(radarId: string, companyId: string, role?: string): Promise<{
        radarId: Types.ObjectId;
        nombre: string;
        status: string;
        last_seen: Date;
        reachable: boolean;
        live: {
            presence: boolean | null;
            detections: number | null;
            lastDetection: number | null;
            wifi_rssi: number | null;
            heap_free: number | null;
            uptime_s: number | null;
            last_seen?: Date | null;
        };
    }>;
    private findAndVerifyOwnership;
    private generateDeviceKey;
    private hashDeviceKey;
    private getHeartbeatCache;
    private normalizeRadar;
    private callLocalApi;
    invalidateStatusCache(companyId: string): Promise<void>;
}
