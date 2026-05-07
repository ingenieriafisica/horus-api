import { Model, Types } from 'mongoose';
import { CompanyDocument } from './entities/company.schema';
import { CreateCompanyDto, UpdateCompanyDto, CreateBranchDto, UpdateBranchDto, AddUserDto, UpdateUserDto } from '../common/dto';
export declare class CompaniesService {
    private readonly companyModel;
    constructor(companyModel: Model<CompanyDocument>);
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
    findById(id: string): Promise<CompanyDocument>;
    findByNit(nit: string): Promise<CompanyDocument>;
    create(dto: CreateCompanyDto): Promise<CompanyDocument>;
    update(id: string, dto: UpdateCompanyDto): Promise<CompanyDocument>;
    softDelete(id: string): Promise<{
        message: string;
    }>;
    addBranch(companyId: string, dto: CreateBranchDto): Promise<CompanyDocument>;
    updateBranch(companyId: string, branchIndex: number, dto: UpdateBranchDto): Promise<CompanyDocument>;
    removeBranch(companyId: string, branchIndex: number): Promise<CompanyDocument>;
    getBranches(companyId: string): Promise<{
        branchIndex: number;
        nombre: string;
        ciudad: string;
        direccion: string;
        timezone?: string;
        active: boolean;
        cameras: Types.ObjectId[];
    }[]>;
    linkCamera(companyId: string, branchIndex: number, cameraId: Types.ObjectId): Promise<void>;
    unlinkCamera(companyId: string, branchIndex: number, cameraId: Types.ObjectId): Promise<void>;
    addUser(companyId: string, dto: AddUserDto): Promise<CompanyDocument>;
    updateUser(companyId: string, email: string, dto: UpdateUserDto): Promise<CompanyDocument>;
    removeUser(companyId: string, email: string): Promise<CompanyDocument>;
    findUserInCompany(companyId: string, email: string): Promise<import("./entities/company.schema").CompanyUser>;
    findCompanyByUserEmail(email: string): Promise<import("mongoose").FlattenMaps<CompanyDocument> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    private assertObjectId;
}
