import { CompaniesService } from './companies.service';
import { AuditService } from '../audit/audit.service';
import { CreateCompanyDto, UpdateCompanyDto, CreateBranchDto, UpdateBranchDto, AddUserDto, UpdateUserDto } from '../common/dto';
export declare class CompaniesController {
    private readonly svc;
    private readonly auditService;
    constructor(svc: CompaniesService, auditService: AuditService);
    findAll(page: number, limit: number): Promise<{
        data: (import("mongoose").FlattenMaps<import("./entities/company.schema").CompanyDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    platformKpis(): Promise<{
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
    getAuditLogs(user: {
        role: string;
        companyId: string;
    }, companyId?: string, limit?: number): Promise<(import("mongoose").FlattenMaps<import("../audit/audit-log.schema").AuditLogDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("./entities/company.schema").CompanyDocument>;
    create(dto: CreateCompanyDto, user: {
        email: string;
        role: string;
    }): Promise<import("./entities/company.schema").CompanyDocument>;
    update(id: string, dto: UpdateCompanyDto, user: {
        email: string;
        role: string;
    }): Promise<import("./entities/company.schema").CompanyDocument>;
    remove(id: string, user: {
        email: string;
        role: string;
    }): Promise<{
        message: string;
    }>;
    getBranches(id: string): Promise<any[]>;
    addBranch(id: string, dto: CreateBranchDto, user: {
        email: string;
        role: string;
    }): Promise<import("./entities/company.schema").CompanyDocument>;
    updateBranch(id: string, branchIndex: number, dto: UpdateBranchDto, user: {
        email: string;
        role: string;
    }): Promise<import("./entities/company.schema").CompanyDocument>;
    removeBranch(id: string, branchIndex: number, user: {
        email: string;
        role: string;
    }): Promise<import("./entities/company.schema").CompanyDocument>;
    addUser(id: string, dto: AddUserDto, user: {
        email: string;
        role: string;
    }): Promise<import("./entities/company.schema").CompanyDocument>;
    updateUser(id: string, email: string, dto: UpdateUserDto, user: {
        email: string;
        role: string;
    }): Promise<import("./entities/company.schema").CompanyDocument>;
    removeUser(id: string, email: string, user: {
        email: string;
        role: string;
    }): Promise<import("./entities/company.schema").CompanyDocument>;
}
