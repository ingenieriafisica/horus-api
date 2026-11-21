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
exports.RadarsController = void 0;
const common_1 = require("@nestjs/common");
const radars_service_1 = require("./radars.service");
const dto_1 = require("../common/dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const guards_1 = require("../common/guards");
const swagger_1 = require("@nestjs/swagger");
let RadarsController = class RadarsController {
    constructor(svc) {
        this.svc = svc;
    }
    create(dto, user) {
        return this.svc.create(dto, user);
    }
    findByCompany(companyId, user) {
        const targetCompanyId = user.role === 'super_admin' && companyId ? companyId : user.companyId;
        return this.svc.findByCompany(targetCompanyId, user);
    }
    findByBranch(companyId, branchIndex, user) {
        const idx = parseInt(branchIndex, 10);
        (0, guards_1.assertBranchAccess)(user, idx);
        const targetCompanyId = user.role === 'super_admin' && companyId ? companyId : user.companyId;
        return this.svc.findByBranch(targetCompanyId, idx);
    }
    statusSummary(companyId, user) {
        const targetCompanyId = user.role === 'super_admin' && companyId ? companyId : user.companyId;
        return this.svc.getStatusSummary(targetCompanyId);
    }
    findOne(id, user) {
        return this.svc.findById(id, user.companyId, user.role);
    }
    update(id, dto, user) {
        return this.svc.update(id, dto, user.companyId, user.role);
    }
    rotateKey(id, user) {
        return this.svc.rotateKey(id, user.companyId, user);
    }
    deactivate(id, companyId, user) {
        const targetCompanyId = user.role === 'super_admin' && companyId ? companyId : user.companyId;
        return this.svc.deactivate(id, targetCompanyId, user);
    }
    heartbeat(dto, authHeader) {
        const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
        return this.svc.heartbeat(dto, bearer);
    }
    probeRealtime(id, user) {
        return this.svc.probeRealtime(id, user.companyId, user.role);
    }
    probeStats(id, user) {
        return this.svc.probeStats(id, user.companyId, user.role);
    }
    probeHealth(id, user) {
        return this.svc.probeHealth(id, user.companyId, user.role);
    }
};
exports.RadarsController = RadarsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar radar', description: 'Registra un nuevo radar ESP32 y devuelve su device_key' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateRadarDto, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar radares por empresa' }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "findByCompany", null);
__decorate([
    (0, common_1.Get)('branch'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar radares por sede' }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('branchIndex')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "findByBranch", null);
__decorate([
    (0, common_1.Get)('status-summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Resumen de estado de radares' }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "statusSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener radar por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar radar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateRadarDto, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/rotate-key'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Rotar API key del radar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "rotateKey", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Desactivar radar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "deactivate", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('heartbeat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Heartbeat ESP32', description: 'Endpoint público autenticado por uid_hardware y Bearer opcional' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.HeartbeatDto, String]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Get)(':id/realtime'),
    (0, swagger_1.ApiOperation)({ summary: 'Telemetría en tiempo real', description: 'Proxy a la API local del radar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "probeRealtime", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Estadísticas del radar', description: 'RSSI, heap libre, uptime' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "probeStats", null);
__decorate([
    (0, common_1.Get)(':id/health'),
    (0, swagger_1.ApiOperation)({ summary: 'Salud del radar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RadarsController.prototype, "probeHealth", null);
exports.RadarsController = RadarsController = __decorate([
    (0, swagger_1.ApiTags)('Radars'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('radars'),
    __metadata("design:paramtypes", [radars_service_1.RadarsService])
], RadarsController);
//# sourceMappingURL=radars.controller.js.map