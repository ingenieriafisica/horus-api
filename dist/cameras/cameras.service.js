"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CamerasService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("../companies/entities/company.schema");
const companies_service_1 = require("../companies/companies.service");
let CamerasService = class CamerasService {
    constructor(cameraModel, companiesService) {
        this.cameraModel = cameraModel;
        this.companiesService = companiesService;
    }
    async create(dto) {
        const company = await this.companiesService.findById(dto.companyId);
        if (!company.sedes[dto.branchIndex]) {
            throw new common_1.NotFoundException(`Sede ${dto.branchIndex} no existe en la empresa`);
        }
        const exists = await this.cameraModel.findOne({ uid_hardware: dto.uid_hardware }).lean();
        if (exists)
            throw new common_1.ConflictException(`uid_hardware '${dto.uid_hardware}' ya registrado`);
        const camera = await new this.cameraModel({
            ...dto,
            companyId: new mongoose_2.Types.ObjectId(dto.companyId),
            status: 'active',
        }).save();
        await this.companiesService.linkCamera(dto.companyId, dto.branchIndex, camera._id);
        return camera;
    }
    async findByCompany(companyId) {
        return this.cameraModel
            .find({ companyId: new mongoose_2.Types.ObjectId(companyId) })
            .lean();
    }
    async findByBranch(companyId, branchIndex) {
        return this.cameraModel
            .find({ companyId: new mongoose_2.Types.ObjectId(companyId), branchIndex })
            .lean();
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('ID inválido');
        const cam = await this.cameraModel.findById(id).exec();
        if (!cam)
            throw new common_1.NotFoundException(`Cámara ${id} no encontrada`);
        return cam;
    }
    async findByHardwareUid(uid) {
        return this.cameraModel.findOne({ uid_hardware: uid }).exec();
    }
    async update(id, dto) {
        const cam = await this.findById(id);
        Object.assign(cam, dto);
        return cam.save();
    }
    async deactivate(id, companyId) {
        const cam = await this.findById(id);
        if (cam.companyId.toString() !== companyId) {
            throw new common_1.UnauthorizedException('No autorizado para esta cámara');
        }
        cam.status = 'inactive';
        await cam.save();
        await this.companiesService.unlinkCamera(companyId, cam.branchIndex, cam._id);
        return { message: `Cámara ${id} desactivada` };
    }
    async heartbeat(dto) {
        const cam = await this.cameraModel.findOne({ uid_hardware: dto.uid_hardware });
        if (!cam)
            throw new common_1.UnauthorizedException('Dispositivo no registrado');
        const update = { last_seen: new Date() };
        if (dto.ip_local)
            update.ip_local = dto.ip_local;
        if (dto.firmware_version)
            update.firmware_version = dto.firmware_version;
        if (cam.status === 'error')
            update.status = 'active';
        await this.cameraModel.findByIdAndUpdate(cam._id, { $set: update });
        return { status: cam.status };
    }
    async getStatusSummary(companyId) {
        const pipeline = [
            { $match: { companyId: new mongoose_2.Types.ObjectId(companyId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ];
        const result = await this.cameraModel.aggregate(pipeline);
        const summary = { active: 0, inactive: 0, error: 0 };
        result.forEach((r) => (summary[r._id] = r.count));
        return summary;
    }
    async validateDevice(uid_hardware) {
        const cam = await this.cameraModel.findOne({ uid_hardware, status: 'active' });
        if (!cam)
            throw new common_1.UnauthorizedException('Dispositivo no registrado o inactivo');
        return cam;
    }
};
exports.CamerasService = CamerasService;
exports.CamerasService = CamerasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(company_schema_1.Camera.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        companies_service_1.CompaniesService])
], CamerasService);
//# sourceMappingURL=cameras.service.js.map