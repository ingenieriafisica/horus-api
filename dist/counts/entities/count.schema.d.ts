import { Document, Types } from 'mongoose';
export type CountDocument = Count & Document;
export declare class Count {
    timestamp: Date;
    meta: {
        companyId: Types.ObjectId;
        cameraId: Types.ObjectId;
        branchIndex: number;
    };
    count_in: number;
    count_out: number;
}
export declare const CountSchema: import("mongoose").Schema<Count, import("mongoose").Model<Count, any, any, any, Document<unknown, any, Count, any, {}> & Count & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Count, Document<unknown, {}, import("mongoose").FlatRecord<Count>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Count> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export interface CountPoint {
    timestamp: string;
    count_in: number;
    count_out: number;
}
export interface CountMetadata {
    total: number;
    period: 'hour' | 'day' | 'week' | 'month';
}
export interface CountResponseDto {
    data: CountPoint[];
    metadata: CountMetadata;
}
