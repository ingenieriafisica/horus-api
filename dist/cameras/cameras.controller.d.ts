import { CamerasService } from './cameras.service';
import { CreateCameraDto, UpdateCameraDto, HeartbeatDto } from '../common/dto';
export declare class CamerasController {
    private readonly svc;
    constructor(svc: CamerasService);
    create(dto: CreateCameraDto): Promise<import("../companies/entities/company.schema").CameraDocument>;
    findByCompany(companyId: string): Promise<import("../companies/entities/company.schema").CameraDocument[]>;
    findByBranch(companyId: string, branchIndex: number): Promise<import("../companies/entities/company.schema").CameraDocument[]>;
    statusSummary(companyId: string): Promise<Record<string, number>>;
    findOne(id: string): Promise<import("../companies/entities/company.schema").CameraDocument>;
    update(id: string, dto: UpdateCameraDto): Promise<import("../companies/entities/company.schema").CameraDocument>;
    deactivate(id: string, companyId: string): Promise<{
        message: string;
    }>;
    heartbeat(dto: HeartbeatDto): Promise<{
        status: string;
    }>;
}
