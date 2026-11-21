import { RadarsService } from './radars.service';
import { CreateRadarDto, UpdateRadarDto, HeartbeatDto } from '../common/dto';
export declare class RadarsController {
    private readonly svc;
    constructor(svc: RadarsService);
    create(dto: CreateRadarDto, user: {
        email: string;
        role: string;
    }): Promise<Record<string, unknown>>;
    findByCompany(companyId: string | undefined, user: {
        companyId: string;
        role: string;
        branchIndexes: number[];
    }): Promise<import("./entities/radar.schema").RadarDocument[]>;
    findByBranch(companyId: string | undefined, branchIndex: string, user: {
        companyId: string;
        role: string;
        branchIndexes: number[];
    }): Promise<import("./entities/radar.schema").RadarDocument[]>;
    statusSummary(companyId: string | undefined, user: {
        companyId: string;
        role: string;
    }): Promise<any>;
    findOne(id: string, user: {
        companyId: string;
        role: string;
    }): Promise<import("./entities/radar.schema").RadarDocument>;
    update(id: string, dto: UpdateRadarDto, user: {
        companyId: string;
        role: string;
    }): Promise<import("./entities/radar.schema").RadarDocument>;
    rotateKey(id: string, user: {
        companyId: string;
        email: string;
        role: string;
    }): Promise<{
        device_key: string;
    }>;
    deactivate(id: string, companyId: string | undefined, user: {
        companyId: string;
        email: string;
        role: string;
    }): Promise<{
        message: string;
    }>;
    heartbeat(dto: HeartbeatDto, authHeader?: string): Promise<{
        status: string;
    }>;
    probeRealtime(id: string, user: {
        companyId: string;
        role: string;
    }): Promise<{
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
    probeStats(id: string, user: {
        companyId: string;
        role: string;
    }): Promise<{
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
    probeHealth(id: string, user: {
        companyId: string;
        role: string;
    }): Promise<{
        radarId: import("mongoose").Types.ObjectId;
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
}
