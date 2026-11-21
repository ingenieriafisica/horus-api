import { Document, Types } from 'mongoose';
export type RadarDocument = Radar & Document;
export declare class Radar {
    uid_hardware: string;
    companyId: Types.ObjectId;
    branchIndex: number;
    nombre: string;
    ip_local: string;
    local_api_port: number;
    status: string;
    firmware_version?: string;
    device_key_hash?: string;
    last_seen?: Date;
    last_heartbeat?: {
        wifi_rssi?: number;
        heap_free?: number;
        uptime_s?: number;
        detections_total?: number;
    };
}
export declare const RadarSchema: import("mongoose").Schema<Radar, import("mongoose").Model<Radar, any, any, any, Document<unknown, any, Radar, any, {}> & Radar & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Radar, Document<unknown, {}, import("mongoose").FlatRecord<Radar>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Radar> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
