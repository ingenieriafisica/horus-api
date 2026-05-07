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
exports.CamerasController = void 0;
const common_1 = require("@nestjs/common");
const cameras_service_1 = require("./cameras.service");
const dto_1 = require("../common/dto");
let CamerasController = class CamerasController {
    constructor(svc) {
        this.svc = svc;
    }
    create(dto) {
        return this.svc.create(dto);
    }
    findByCompany(companyId) {
        return this.svc.findByCompany(companyId);
    }
    findByBranch(companyId, branchIndex) {
        return this.svc.findByBranch(companyId, branchIndex);
    }
    statusSummary(companyId) {
        return this.svc.getStatusSummary(companyId);
    }
    findOne(id) {
        return this.svc.findById(id);
    }
    update(id, dto) {
        return this.svc.update(id, dto);
    }
    deactivate(id, companyId) {
        return this.svc.deactivate(id, companyId);
    }
    heartbeat(dto) {
        return this.svc.heartbeat(dto);
    }
};
exports.CamerasController = CamerasController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCameraDto]),
    __metadata("design:returntype", void 0)
], CamerasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CamerasController.prototype, "findByCompany", null);
__decorate([
    (0, common_1.Get)('branch'),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('branchIndex', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], CamerasController.prototype, "findByBranch", null);
__decorate([
    (0, common_1.Get)('status-summary'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CamerasController.prototype, "statusSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CamerasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCameraDto]),
    __metadata("design:returntype", void 0)
], CamerasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CamerasController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)('heartbeat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.HeartbeatDto]),
    __metadata("design:returntype", void 0)
], CamerasController.prototype, "heartbeat", null);
exports.CamerasController = CamerasController = __decorate([
    (0, common_1.Controller)('cameras'),
    __metadata("design:paramtypes", [cameras_service_1.CamerasService])
], CamerasController);
//# sourceMappingURL=cameras.controller.js.map