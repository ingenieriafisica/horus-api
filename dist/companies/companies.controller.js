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
const dto_1 = require("../common/dto");
let CompaniesController = class CompaniesController {
    constructor(svc) {
        this.svc = svc;
    }
    findAll(page, limit) {
        return this.svc.findAll(page, limit);
    }
    findOne(id) {
        return this.svc.findById(id);
    }
    create(dto) {
        return this.svc.create(dto);
    }
    update(id, dto) {
        return this.svc.update(id, dto);
    }
    remove(id) {
        return this.svc.softDelete(id);
    }
    getBranches(id) {
        return this.svc.getBranches(id);
    }
    addBranch(id, dto) {
        return this.svc.addBranch(id, dto);
    }
    updateBranch(id, branchIndex, dto) {
        return this.svc.updateBranch(id, branchIndex, dto);
    }
    removeBranch(id, branchIndex) {
        return this.svc.removeBranch(id, branchIndex);
    }
    addUser(id, dto) {
        return this.svc.addUser(id, dto);
    }
    updateUser(id, email, dto) {
        return this.svc.updateUser(id, email, dto);
    }
    removeUser(id, email) {
        return this.svc.removeUser(id, email);
    }
};
exports.CompaniesController = CompaniesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCompanyDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/branches'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getBranches", null);
__decorate([
    (0, common_1.Post)(':id/branches'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateBranchDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "addBranch", null);
__decorate([
    (0, common_1.Patch)(':id/branches/:branchIndex'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('branchIndex', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, dto_1.UpdateBranchDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "updateBranch", null);
__decorate([
    (0, common_1.Delete)(':id/branches/:branchIndex'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('branchIndex', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "removeBranch", null);
__decorate([
    (0, common_1.Post)(':id/users'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddUserDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "addUser", null);
__decorate([
    (0, common_1.Patch)(':id/users/:email'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('email')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)(':id/users/:email'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "removeUser", null);
exports.CompaniesController = CompaniesController = __decorate([
    (0, common_1.Controller)('companies'),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService])
], CompaniesController);
//# sourceMappingURL=companies.controller.js.map