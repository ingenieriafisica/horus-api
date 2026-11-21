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
const radar_schema_1 = require("../radars/entities/radar.schema");
const count_schema_1 = require("../counts/entities/count.schema");
const audit_service_1 = require("../audit/audit.service");
let CompaniesService = class CompaniesService {
    constructor(companyModel, radarModel, countModel, auditService) {
        this.companyModel = companyModel;
        this.radarModel = radarModel;
        this.countModel = countModel;
        this.auditService = auditService;
    }
    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.companyModel
                .find({ status: { $ne: 'deleted' } })
                .select('-users -sedes.radars')
                .skip(skip)
                .limit(limit)
                .lean(),
            this.companyModel.countDocuments({ status: { $ne: 'deleted' } }),
        ]);
        return { data, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async getPlatformKpis() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const [totalTenants, activeTenants, planBreakdown, radarBreakdown, todayCounts,] = await Promise.all([
            this.companyModel.countDocuments({ status: { $ne: 'deleted' } }),
            this.companyModel.countDocuments({ status: 'active' }),
            this.companyModel.aggregate([
                { $match: { status: { $ne: 'deleted' } } },
                { $group: { _id: '$plan', count: { $sum: 1 } } },
            ]),
            this.radarModel.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            this.countModel.aggregate([
                { $match: { timestamp: { $gte: startOfDay } } },
                {
                    $group: {
                        _id: null,
                        total_in: { $sum: '$count_in' },
                        total_out: { $sum: '$count_out' },
                        events: { $sum: 1 },
                    },
                },
            ]),
        ]);
        const plans = { starter: 0, pro: 0, enterprise: 0 };
        planBreakdown.forEach((p) => (plans[p._id] = p.count));
        const radars = { active: 0, inactive: 0, error: 0, offline: 0 };
        radarBreakdown.forEach((r) => (radars[r._id] = r.count));
        return {
            tenants: { total: totalTenants, active: activeTenants, plans },
            radars: {
                total: Object.values(radars).reduce((a, b) => a + b, 0),
                ...radars,
            },
            today: todayCounts[0] ?? { total_in: 0, total_out: 0, events: 0 },
            generatedAt: new Date(),
        };
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
    async create(dto, actor) {
        const exists = await this.companyModel
            .findOne({ $or: [{ nit: dto.nit }, { dbName: dto.dbName }] })
            .lean();
        if (exists) {
            throw new common_1.ConflictException('NIT o dbName ya registrado');
        }
        const company = await new this.companyModel(dto).save();
        await this.auditService.log({
            companyId: company._id.toString(),
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'CREATE_COMPANY',
            resource: 'company',
            resourceId: company._id.toString(),
            details: { nombre: dto.nombre, plan: company.plan },
        });
        return company;
    }
    async update(id, dto, actor) {
        const company = await this.findById(id);
        if (actor?.role !== 'super_admin' && (dto.plan !== undefined || dto.status !== undefined)) {
            throw new common_1.ForbiddenException('Solo Super Admin puede modificar el plan o estado de la empresa');
        }
        Object.assign(company, dto);
        const saved = await company.save();
        await this.auditService.log({
            companyId: id,
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'UPDATE_COMPANY',
            resource: 'company',
            resourceId: id,
            details: { ...dto },
        });
        return saved;
    }
    async softDelete(id, actor) {
        await this.findById(id);
        await this.companyModel.findByIdAndUpdate(id, { status: 'deleted' });
        await this.auditService.log({
            companyId: id,
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'DELETE_COMPANY',
            resource: 'company',
            resourceId: id,
        });
        return { message: `Empresa ${id} eliminada` };
    }
    async addBranch(companyId, dto, actor) {
        const company = await this.findById(companyId);
        const limits = company_schema_1.PLAN_LIMITS[company.plan] ?? company_schema_1.PLAN_LIMITS.starter;
        const activeBranches = company.sedes.filter((s) => s.active).length;
        if (activeBranches >= limits.maxBranches) {
            throw new common_1.ForbiddenException(`Tu plan ${limits.label} permite máximo ${limits.maxBranches} sedes activas. Actualiza tu plan para agregar más.`);
        }
        company.sedes.push({ ...dto, active: true, radars: [] });
        const saved = await company.save();
        await this.auditService.log({
            companyId,
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'ADD_BRANCH',
            resource: 'branch',
            resourceId: String(saved.sedes.length - 1),
            details: { nombre: dto.nombre, ciudad: dto.ciudad },
        });
        return saved;
    }
    async updateBranch(companyId, branchIndex, dto, actor) {
        const company = await this.findById(companyId);
        const branch = company.sedes[branchIndex];
        if (!branch)
            throw new common_1.NotFoundException(`Sede ${branchIndex} no existe`);
        Object.assign(branch, dto);
        company.markModified('sedes');
        const saved = await company.save();
        await this.auditService.log({
            companyId,
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'UPDATE_BRANCH',
            resource: 'branch',
            resourceId: String(branchIndex),
            details: { ...dto },
        });
        return saved;
    }
    async removeBranch(companyId, branchIndex, actor) {
        const company = await this.findById(companyId);
        if (!company.sedes[branchIndex]) {
            throw new common_1.NotFoundException(`Sede ${branchIndex} no existe`);
        }
        company.sedes[branchIndex].active = false;
        company.markModified('sedes');
        const saved = await company.save();
        await this.auditService.log({
            companyId,
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'REMOVE_BRANCH',
            resource: 'branch',
            resourceId: String(branchIndex),
        });
        return saved;
    }
    async getBranches(companyId) {
        const company = await this.findById(companyId);
        return company.sedes.map((s, i) => ({
            ...(typeof s.toObject === 'function' ? s.toObject() : s),
            branchIndex: i,
        }));
    }
    async linkRadar(companyId, branchIndex, radarId) {
        const company = await this.findById(companyId);
        if (!company.sedes[branchIndex]) {
            throw new common_1.NotFoundException(`Sede ${branchIndex} no existe`);
        }
        const alreadyLinked = company.sedes[branchIndex].radars.some((r) => r.toString() === radarId.toString());
        if (!alreadyLinked) {
            company.sedes[branchIndex].radars.push(radarId);
            company.markModified('sedes');
            await company.save();
        }
    }
    async unlinkRadar(companyId, branchIndex, radarId) {
        const company = await this.findById(companyId);
        if (!company.sedes[branchIndex])
            return;
        company.sedes[branchIndex].radars = company.sedes[branchIndex].radars.filter((r) => r.toString() !== radarId.toString());
        company.markModified('sedes');
        await company.save();
    }
    async addUser(companyId, dto, actor) {
        if (dto.role === 'super_admin' && actor?.role !== 'super_admin') {
            throw new common_1.ForbiddenException('Solo un Super Admin puede asignar el rol super_admin');
        }
        const company = await this.findById(companyId);
        const normalizedEmail = dto.email.toLowerCase().trim();
        const already = company.users.find((u) => u.email.toLowerCase() === normalizedEmail);
        if (already) {
            if (!already.active) {
                already.active = true;
                already.role = dto.role;
                already.branchIndexes = dto.branchIndexes ?? [];
                company.markModified('users');
                return company.save();
            }
            throw new common_1.ConflictException(`${normalizedEmail} ya está registrado en esta empresa`);
        }
        company.users.push({
            email: normalizedEmail,
            role: dto.role,
            active: true,
            branchIndexes: dto.branchIndexes ?? [],
        });
        const saved = await company.save();
        await this.auditService.log({
            companyId,
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'ADD_USER',
            resource: 'user',
            resourceId: normalizedEmail,
            details: { role: dto.role, branchIndexes: dto.branchIndexes ?? [] },
        });
        return saved;
    }
    async updateUser(companyId, email, dto, actor) {
        if (dto.role === 'super_admin' && actor?.role !== 'super_admin') {
            throw new common_1.ForbiddenException('Solo un Super Admin puede asignar el rol super_admin');
        }
        const company = await this.findById(companyId);
        const user = company.users.find((u) => u.email === email);
        if (!user)
            throw new common_1.NotFoundException(`Usuario ${email} no encontrado`);
        Object.assign(user, dto);
        company.markModified('users');
        return company.save();
    }
    async removeUser(companyId, email, actor) {
        const company = await this.findById(companyId);
        const idx = company.users.findIndex((u) => u.email === email);
        if (idx === -1)
            throw new common_1.NotFoundException(`Usuario ${email} no encontrado`);
        company.users[idx].active = false;
        company.markModified('users');
        const saved = await company.save();
        await this.auditService.log({
            companyId,
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'REMOVE_USER',
            resource: 'user',
            resourceId: email,
        });
        return saved;
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
    __param(1, (0, mongoose_1.InjectModel)(radar_schema_1.Radar.name)),
    __param(2, (0, mongoose_1.InjectModel)(count_schema_1.Count.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        audit_service_1.AuditService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map