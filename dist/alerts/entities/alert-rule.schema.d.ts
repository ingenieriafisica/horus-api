import { Document, Types } from 'mongoose';
export type AlertRuleDocument = AlertRule & Document;
export declare class AlertRule {
    companyId: Types.ObjectId;
    branchIndex?: number;
    name: string;
    type: 'max_occupancy' | 'radar_offline';
    threshold: number;
    offline_minutes: number;
    notify_email: boolean;
    email_recipients: string[];
    active: boolean;
}
export declare const AlertRuleSchema: import("mongoose").Schema<AlertRule, import("mongoose").Model<AlertRule, any, any, any, Document<unknown, any, AlertRule, any, {}> & AlertRule & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AlertRule, Document<unknown, {}, import("mongoose").FlatRecord<AlertRule>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AlertRule> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
