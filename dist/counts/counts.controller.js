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
exports.CountsController = void 0;
const common_1 = require("@nestjs/common");
const counts_service_1 = require("./counts.service");
const dto_1 = require("../common/dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const guards_1 = require("../common/guards");
const swagger_1 = require("@nestjs/swagger");
let CountsController = class CountsController {
    constructor(svc) {
        this.svc = svc;
    }
    ingest(dto, authHeader) {
        const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
        return this.svc.ingest(dto, bearer);
    }
    query(dto, user) {
        (0, guards_1.assertBranchAccess)(user, dto.branchIndex);
        const allowed = this.allowedBranches(user);
        return this.svc.query(dto, allowed);
    }
    async exportCsv(dto, user, res) {
        (0, guards_1.assertBranchAccess)(user, dto.branchIndex);
        const allowed = this.allowedBranches(user);
        const csv = await this.svc.exportCsv(dto, allowed);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="horus-counts.csv"');
        res.send(csv);
    }
    kpis(companyId, user, branchIndex, radarId) {
        const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
        (0, guards_1.assertBranchAccess)(user, idx);
        return this.svc.getKpis(companyId, idx, radarId, this.allowedBranches(user));
    }
    compare(companyId, from, to, user, branchIndex, radarId) {
        const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
        (0, guards_1.assertBranchAccess)(user, idx);
        return this.svc.compare(companyId, from, to, idx, radarId, this.allowedBranches(user));
    }
    compareByBranch(companyId, from, to, user) {
        return this.svc.compareByBranch(companyId, from, to, this.allowedBranches(user));
    }
    byRadar(companyId, from, to, user, branchIndex) {
        const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
        (0, guards_1.assertBranchAccess)(user, idx);
        return this.svc.byRadar(companyId, from, to, idx, this.allowedBranches(user));
    }
    byCompany(from, to) {
        return this.svc.byCompany(from, to);
    }
    allowedBranches(user) {
        if (user.role === 'admin' || user.role === 'super_admin')
            return undefined;
        return user.branchIndexes?.length ? user.branchIndexes : undefined;
    }
};
exports.CountsController = CountsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('ingest'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Ingestar conteos', description: 'Público, autenticado por uid_hardware y Bearer opcional del ESP32' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.IngestCountDto, String]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "ingest", null);
__decorate([
    (0, common_1.Get)('query'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar series temporales', description: 'Devuelve conteos agrupados por hora, día, semana o mes' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CountQueryDto, Object]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "query", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, swagger_1.ApiOperation)({ summary: 'Exportar conteos en CSV' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CountQueryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CountsController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)('kpis'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener KPIs', description: 'Visitantes hoy, mes, año y hora pico' }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('branchIndex')),
    __param(3, (0, common_1.Query)('radarId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "kpis", null);
__decorate([
    (0, common_1.Get)('compare'),
    (0, swagger_1.ApiOperation)({ summary: 'Comparar períodos', description: 'Comparativa período actual vs anterior' }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __param(4, (0, common_1.Query)('branchIndex')),
    __param(5, (0, common_1.Query)('radarId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, String, String]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "compare", null);
__decorate([
    (0, common_1.Get)('by-branch'),
    (0, swagger_1.ApiOperation)({ summary: 'Conteos por sede', description: 'Comparativa y ranking de sedes' }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "compareByBranch", null);
__decorate([
    (0, common_1.Get)('by-radar'),
    (0, swagger_1.ApiOperation)({ summary: 'Conteos por radar', description: 'Conteos discriminados por dispositivo' }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __param(4, (0, common_1.Query)('branchIndex')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, String]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "byRadar", null);
__decorate([
    (0, common_1.Get)('by-company'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Conteos por empresa (Global)', description: 'Restringido a super_admin' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "byCompany", null);
exports.CountsController = CountsController = __decorate([
    (0, swagger_1.ApiTags)('Counts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('counts'),
    __metadata("design:paramtypes", [counts_service_1.CountsService])
], CountsController);
//# sourceMappingURL=counts.controller.js.map