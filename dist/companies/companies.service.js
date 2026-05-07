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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("./entities/company.schema");
let CompaniesService = class CompaniesService {
    constructor(companyModel) {
        this.companyModel = companyModel;
    }
    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.companyModel
                .find({ status: { $ne: 'deleted' } })
                .select('-users -sedes.cameras')
                .skip(skip)
                .limit(limit)
                .lean(),
            this.companyModel.countDocuments({ status: { $ne: 'deleted' } }),
        ]);
        return { data, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async findById(id) {
        this.assertObjectId(id);
        const company = await this.companyModel.findById(id).exec();
        if (!company || company.status === 'deleted') {
            throw new common_1.NotFoundException(`Empresa ${id} no encontrada`);
        }
        return company;
    }
    async findByNit(nit) {
        const company = await this.companyModel.findOne({ nit, status: { $ne: 'deleted' } }).exec();
        if (!company)
            throw new common_1.NotFoundException(`Empresa con NIT ${nit} no encontrada`);
        return company;
    }
    async create(dto) {
        const exists = await this.companyModel
            .findOne({ $or: [{ nit: dto.nit }, { dbName: dto.dbName }] })
            .lean();
        if (exists) {
            throw new common_1.ConflictException('NIT o dbName ya registrado');
        }
        const company = new this.companyModel(dto);
        return company.save();
    }
    async update(id, dto) {
        const company = await this.findById(id);
        Object.assign(company, dto);
        return company.save();
    }
    async softDelete(id) {
        await this.findById(id);
        await this.companyModel.findByIdAndUpdate(id, { status: 'deleted' });
        return { message: `Empresa ${id} eliminada` };
    }
    async addBranch(companyId, dto) {
        const company = await this.findById(companyId);
        company.sedes.push({ ...dto, active: true, cameras: [] });
        return company.save();
    }
    async updateBranch(companyId, branchIndex, dto) {
        const company = await this.findById(companyId);
        const branch = company.sedes[branchIndex];
        if (!branch)
            throw new common_1.NotFoundException(`Sede ${branchIndex} no existe`);
        Object.assign(branch, dto);
        company.markModified('sedes');
        return company.save();
    }
    async removeBranch(companyId, branchIndex) {
        const company = await this.findById(companyId);
        if (!company.sedes[branchIndex]) {
            throw new common_1.NotFoundException(`Sede ${branchIndex} no existe`);
        }
        company.sedes[branchIndex].active = false;
        company.markModified('sedes');
        return company.save();
    }
    async getBranches(companyId) {
        const company = await this.findById(companyId);
        return company.sedes.map((s, i) => ({ ...s, branchIndex: i }));
    }
    async linkCamera(companyId, branchIndex, cameraId) {
        const company = await this.findById(companyId);
        if (!company.sedes[branchIndex]) {
            throw new common_1.NotFoundException(`Sede ${branchIndex} no existe`);
        }
        const alreadyLinked = company.sedes[branchIndex].cameras.some((c) => c.toString() === cameraId.toString());
        if (!alreadyLinked) {
            company.sedes[branchIndex].cameras.push(cameraId);
            company.markModified('sedes');
            await company.save();
        }
    }
    async unlinkCamera(companyId, branchIndex, cameraId) {
        const company = await this.findById(companyId);
        if (!company.sedes[branchIndex])
            return;
        company.sedes[branchIndex].cameras = company.sedes[branchIndex].cameras.filter((c) => c.toString() !== cameraId.toString());
        company.markModified('sedes');
        await company.save();
    }
    async addUser(companyId, dto) {
        const company = await this.findById(companyId);
        const already = company.users.find((u) => u.email === dto.email);
        if (already)
            throw new common_1.ConflictException(`${dto.email} ya está registrado en esta empresa`);
        company.users.push({ ...dto, active: true, branchIndexes: dto.branchIndexes ?? [] });
        return company.save();
    }
    async updateUser(companyId, email, dto) {
        const company = await this.findById(companyId);
        const user = company.users.find((u) => u.email === email);
        if (!user)
            throw new common_1.NotFoundException(`Usuario ${email} no encontrado`);
        Object.assign(user, dto);
        company.markModified('users');
        return company.save();
    }
    async removeUser(companyId, email) {
        const company = await this.findById(companyId);
        const idx = company.users.findIndex((u) => u.email === email);
        if (idx === -1)
            throw new common_1.NotFoundException(`Usuario ${email} no encontrado`);
        company.users[idx].active = false;
        company.markModified('users');
        return company.save();
    }
    async findUserInCompany(companyId, email) {
        const company = await this.findById(companyId);
        return company.users.find((u) => u.email === email && u.active);
    }
    async findCompanyByUserEmail(email) {
        return this.companyModel
            .findOne({ 'users.email': email, 'users.active': true, status: 'active' })
            .lean();
    }
    assertObjectId(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException(`ID inválido: ${id}`);
        }
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map