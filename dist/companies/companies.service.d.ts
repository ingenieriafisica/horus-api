import { Model, Types } from 'mongoose';
import { CompanyDocument } from './entities/company.schema';
import { RadarDocument } from '../radars/entities/radar.schema';
import { CountDocument } from '../counts/entities/count.schema';
import { AuditService } from '../audit/audit.service';
import { CreateCompanyDto, UpdateCompanyDto, CreateBranchDto, UpdateBranchDto, AddUserDto, UpdateUserDto } from '../common/dto';
export declare class CompaniesService {
    private readonly companyModel;
    private readonly radarModel;
    private readonly countModel;
    private readonly auditService;
    constructor(companyModel: Model<CompanyDocument>, radarModel: Model<RadarDocument>, countModel: Model<CountDocument>, auditService: AuditService);
    findAll(page?: number, limit?: number): Promise<{
        data: (import("mongoose").FlattenMaps<CompanyDocument> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    getPlatformKpis(): Promise<{
        tenants: {
            total: number;
            active: number;
            plans: Record<string, number>;
        };
        radars: {
            total: number;
        };
        today: any;
        generatedAt: Date;
    }>;
    findById(id: string): Promise<CompanyDocument>;
    findByNit(nit: string): Promise<CompanyDocument>;
    create(dto: CreateCompanyDto, actor?: {
        email?: string;
        role?: string;
    }): Promise<CompanyDocument>;
    update(id: string, dto: UpdateCompanyDto, actor?: {
        email?: string;
        role?: string;
    }): Promise<CompanyDocument>;
    softDelete(id: string, actor?: {
        email?: string;
        role?: string;
    }): Promise<{
        message: string;
    }>;
    addBranch(companyId: string, dto: CreateBranchDto, actor?: {
        email?: string;
        role?: string;
    }): Promise<CompanyDocument>;
    updateBranch(companyId: string, branchIndex: number, dto: UpdateBranchDto, actor?: {
        email?: string;
        role?: string;
    }): Promise<CompanyDocument>;
    removeBranch(companyId: string, branchIndex: number, actor?: {
        email?: string;
        role?: string;
    }): Promise<CompanyDocument>;
    getBranches(companyId: string): Promise<any[]>;
    linkRadar(companyId: string, branchIndex: number, radarId: Types.ObjectId): Promise<void>;
    unlinkRadar(companyId: string, branchIndex: number, radarId: Types.ObjectId): Promise<void>;
    addUser(companyId: string, dto: AddUserDto, actor?: {
        email?: string;
        role?: string;
    }): Promise<CompanyDocument>;
    updateUser(companyId: string, email: string, dto: UpdateUserDto, actor?: {
        email?: string;
        role?: string;
    }): Promise<CompanyDocument>;
    removeUser(companyId: string, email: string, actor?: {
        email?: string;
        role?: string;
    }): Promise<CompanyDocument>;
    findUserInCompany(companyId: string, email: string): Promise<import("./entities/company.schema").CompanyUser>;
    findCompanyByUserEmail(email: string): Promise<import("mongoose").FlattenMaps<CompanyDocument> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    private assertObjectId;
}
