import { Document, Types } from 'mongoose';
export type AlertEventDocument = AlertEvent & Document;
export declare class AlertEvent {
    companyId: Types.ObjectId;
    branchIndex?: number;
    radarId?: Types.ObjectId;
    ruleId?: Types.ObjectId;
    type: 'max_occupancy' | 'radar_offline';
    severity: 'warning' | 'critical';
    title: string;
    message: string;
    value?: number;
    threshold?: number;
    acknowledged: boolean;
    acknowledged_by?: string;
    acknowledged_at?: Date;
}
export declare const AlertEventSchema: import("mongoose").Schema<AlertEvent, import("mongoose").Model<AlertEvent, any, any, any, Document<unknown, any, AlertEvent, any, {}> & AlertEvent & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AlertEvent, Document<unknown, {}, import("mongoose").FlatRecord<AlertEvent>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AlertEvent> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
