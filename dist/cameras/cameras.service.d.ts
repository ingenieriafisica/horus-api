import { Model } from 'mongoose';
import { CameraDocument } from '../companies/entities/company.schema';
import { CompaniesService } from '../companies/companies.service';
import { CreateCameraDto, UpdateCameraDto, HeartbeatDto } from '../common/dto';
export declare class CamerasService {
    private readonly cameraModel;
    private readonly companiesService;
    constructor(cameraModel: Model<CameraDocument>, companiesService: CompaniesService);
    create(dto: CreateCameraDto): Promise<CameraDocument>;
    findByCompany(companyId: string): Promise<CameraDocument[]>;
    findByBranch(companyId: string, branchIndex: number): Promise<CameraDocument[]>;
    findById(id: string): Promise<CameraDocument>;
    findByHardwareUid(uid: string): Promise<CameraDocument | null>;
    update(id: string, dto: UpdateCameraDto): Promise<CameraDocument>;
    deactivate(id: string, companyId: string): Promise<{
        message: string;
    }>;
    heartbeat(dto: HeartbeatDto): Promise<{
        status: string;
    }>;
    getStatusSummary(companyId: string): Promise<Record<string, number>>;
    validateDevice(uid_hardware: string): Promise<CameraDocument>;
}
