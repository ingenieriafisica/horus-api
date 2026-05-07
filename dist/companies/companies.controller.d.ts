import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, CreateBranchDto, UpdateBranchDto, AddUserDto, UpdateUserDto } from '../common/dto';
export declare class CompaniesController {
    private readonly svc;
    constructor(svc: CompaniesService);
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
    findOne(id: string): Promise<import("./entities/company.schema").CompanyDocument>;
    create(dto: CreateCompanyDto): Promise<import("./entities/company.schema").CompanyDocument>;
    update(id: string, dto: UpdateCompanyDto): Promise<import("./entities/company.schema").CompanyDocument>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getBranches(id: string): Promise<{
        branchIndex: number;
        nombre: string;
        ciudad: string;
        direccion: string;
        timezone?: string;
        active: boolean;
        cameras: import("mongoose").Types.ObjectId[];
    }[]>;
    addBranch(id: string, dto: CreateBranchDto): Promise<import("./entities/company.schema").CompanyDocument>;
    updateBranch(id: string, branchIndex: number, dto: UpdateBranchDto): Promise<import("./entities/company.schema").CompanyDocument>;
    removeBranch(id: string, branchIndex: number): Promise<import("./entities/company.schema").CompanyDocument>;
    addUser(id: string, dto: AddUserDto): Promise<import("./entities/company.schema").CompanyDocument>;
    updateUser(id: string, email: string, dto: UpdateUserDto): Promise<import("./entities/company.schema").CompanyDocument>;
    removeUser(id: string, email: string): Promise<import("./entities/company.schema").CompanyDocument>;
}
