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
exports.AlertsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const alerts_service_1 = require("./alerts.service");
const dto_1 = require("../common/dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_guard_1 = require("../auth/roles.guard");
let AlertsController = class AlertsController {
    constructor(svc) {
        this.svc = svc;
    }
    findEvents(user, companyId, acknowledged, limit = 50) {
        const targetCompanyId = user.role === 'super_admin' && companyId ? companyId : user.companyId;
        const ackFilter = acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined;
        const allowedBranches = user.role === 'admin' || user.role === 'super_admin' ? undefined : user.branchIndexes;
        return this.svc.findEvents(targetCompanyId, ackFilter, limit, allowedBranches);
    }
    acknowledge(id, user) {
        return this.svc.acknowledgeEvent(id, user.companyId, user);
    }
    findRules(user, companyId) {
        const targetCompanyId = user.role === 'super_admin' && companyId ? companyId : user.companyId;
        return this.svc.findRules(targetCompanyId);
    }
    createRule(dto, user) {
        const payload = {
            ...dto,
            companyId: user.role === 'super_admin' ? dto.companyId : user.companyId,
        };
        return this.svc.createRule(payload, user);
    }
    updateRule(id, dto, user) {
        return this.svc.updateRule(id, user.companyId, dto, user.role);
    }
    deleteRule(id, user) {
        return this.svc.deleteRule(id, user.companyId, user.role);
    }
};
exports.AlertsController = AlertsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar eventos de alerta' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('acknowledged')),
    __param(3, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "findEvents", null);
__decorate([
    (0, common_1.Patch)(':id/acknowledge'),
    (0, roles_guard_1.Roles)('admin', 'manager', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar alerta como atendida' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Get)('rules'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar reglas de alerta' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "findRules", null);
__decorate([
    (0, common_1.Post)('rules'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Crear regla de alerta' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAlertRuleDto, Object]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "createRule", null);
__decorate([
    (0, common_1.Patch)('rules/:id'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar regla de alerta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateAlertRuleDto, Object]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "updateRule", null);
__decorate([
    (0, common_1.Delete)('rules/:id'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar regla de alerta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "deleteRule", null);
exports.AlertsController = AlertsController = __decorate([
    (0, swagger_1.ApiTags)('Alerts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('alerts'),
    __metadata("design:paramtypes", [alerts_service_1.AlertsService])
], AlertsController);
//# sourceMappingURL=alerts.controller.js.map