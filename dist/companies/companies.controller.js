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
exports.CompaniesController = void 0;
const common_1 = require("@nestjs/common");
const companies_service_1 = require("./companies.service");
const audit_service_1 = require("../audit/audit.service");
const roles_guard_1 = require("../auth/roles.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const guards_1 = require("../common/guards");
const dto_1 = require("../common/dto");
const swagger_1 = require("@nestjs/swagger");
let CompaniesController = class CompaniesController {
    constructor(svc, auditService) {
        this.svc = svc;
        this.auditService = auditService;
    }
    findAll(page, limit) {
        return this.svc.findAll(page, limit);
    }
    platformKpis() {
        return this.svc.getPlatformKpis();
    }
    getAuditLogs(user, companyId, limit = 50) {
        const targetCompanyId = user.role === 'super_admin' ? companyId : user.companyId;
        return this.auditService.findLogs(targetCompanyId, limit);
    }
    findOne(id) {
        return this.svc.findById(id);
    }
    create(dto, user) {
        return this.svc.create(dto, user);
    }
    update(id, dto, user) {
        return this.svc.update(id, dto, user);
    }
    remove(id, user) {
        return this.svc.softDelete(id, user);
    }
    getBranches(id) {
        return this.svc.getBranches(id);
    }
    addBranch(id, dto, user) {
        return this.svc.addBranch(id, dto, user);
    }
    updateBranch(id, branchIndex, dto, user) {
        return this.svc.updateBranch(id, branchIndex, dto, user);
    }
    removeBranch(id, branchIndex, user) {
        return this.svc.removeBranch(id, branchIndex, user);
    }
    addUser(id, dto, user) {
        return this.svc.addUser(id, dto, user);
    }
    updateUser(id, email, dto, user) {
        return this.svc.updateUser(id, email, dto, user);
    }
    removeUser(id, email, user) {
        return this.svc.removeUser(id, email, user);
    }
};
exports.CompaniesController = CompaniesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar empresas', description: 'Super Admin: lista todas las empresas con paginación' }),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('platform-kpis'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'KPIs globales de plataforma', description: 'Super Admin: total tenants, radares y conteos de hoy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "platformKpis", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Logs de auditoría', description: 'Historial de acciones administrativas' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener empresa', description: 'Obtiene una empresa por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Crear empresa', description: 'Super Admin: crea una nueva empresa (tenant)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar empresa', description: 'Actualiza los datos de la empresa' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar empresa', description: 'Super Admin: soft delete de la empresa' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/branches'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar sedes', description: 'Lista las sedes de una empresa' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getBranches", null);
__decorate([
    (0, common_1.Post)(':id/branches'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Crear sede', description: 'Añade una sede a la empresa' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateBranchDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "addBranch", null);
__decorate([
    (0, common_1.Patch)(':id/branches/:branchIndex'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar sede', description: 'Actualiza una sede por su índice' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('branchIndex', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, dto_1.UpdateBranchDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "updateBranch", null);
__decorate([
    (0, common_1.Delete)(':id/branches/:branchIndex'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Desactivar sede', description: 'Desactiva una sede (soft delete)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('branchIndex', common_1.ParseIntPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "removeBranch", null);
__decorate([
    (0, common_1.Post)(':id/users'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Invitar usuario', description: 'Agrega un usuario a la empresa' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddUserDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "addUser", null);
__decorate([
    (0, common_1.Patch)(':id/users/:email'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar usuario', description: 'Actualiza rol o sedes asignadas de un usuario' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('email')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)(':id/users/:email'),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Desactivar usuario', description: 'Desactiva un usuario de la empresa' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('email')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "removeUser", null);
exports.CompaniesController = CompaniesController = __decorate([
    (0, swagger_1.ApiTags)('Companies'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, guards_1.TenantIdParam)('id'),
    (0, common_1.Controller)('companies'),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService,
        audit_service_1.AuditService])
], CompaniesController);
//# sourceMappingURL=companies.controller.js.map