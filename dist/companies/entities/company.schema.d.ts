import { Document, Types } from 'mongoose';
export type CameraDocument = Camera & Document;
export declare class Camera {
    uid_hardware: string;
    companyId: Types.ObjectId;
    branchIndex: number;
    ubicacion_cam: string;
    ip_local: string;
    status: string;
    firmware_version?: string;
    last_seen?: Date;
}
export declare const CameraSchema: import("mongoose").Schema<Camera, import("mongoose").Model<Camera, any, any, any, Document<unknown, any, Camera, any, {}> & Camera & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Camera, Document<unknown, {}, import("mongoose").FlatRecord<Camera>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Camera> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Branch {
    nombre: string;
    ciudad: string;
    direccion: string;
    timezone?: string;
    active: boolean;
    cameras: Types.ObjectId[];
}
export declare const BranchSchema: import("mongoose").Schema<Branch, import("mongoose").Model<Branch, any, any, any, Document<unknown, any, Branch, any, {}> & Branch & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Branch, Document<unknown, {}, import("mongoose").FlatRecord<Branch>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Branch> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class CompanyUser {
    email: string;
    role: string;
    active: boolean;
    last_login?: Date;
    branchIndexes: number[];
}
export declare const CompanyUserSchema: import("mongoose").Schema<CompanyUser, import("mongoose").Model<CompanyUser, any, any, any, Document<unknown, any, CompanyUser, any, {}> & CompanyUser & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CompanyUser, Document<unknown, {}, import("mongoose").FlatRecord<CompanyUser>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<CompanyUser> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export type CompanyDocument = Company & Document;
export declare class Company {
    nombre: string;
    nit: string;
    dbName: string;
    status: string;
    plan: string;
    logo_url?: string;
    contacto_email?: string;
    sedes: Branch[];
    users: CompanyUser[];
}
export declare const CompanySchema: import("mongoose").Schema<Company, import("mongoose").Model<Company, any, any, any, Document<unknown, any, Company, any, {}> & Company & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Company, Document<unknown, {}, import("mongoose").FlatRecord<Company>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Company> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
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
