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
let CountsController = class CountsController {
    constructor(svc) {
        this.svc = svc;
    }
    ingest(dto) {
        return this.svc.ingest(dto);
    }
    query(dto) {
        return this.svc.query(dto);
    }
    kpis(companyId, branchIndex) {
        const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
        return this.svc.getKpis(companyId, idx);
    }
    compare(companyId, from, to, branchIndex) {
        const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
        return this.svc.compare(companyId, from, to, idx);
    }
    compareByBranch(companyId, from, to) {
        return this.svc.compareByBranch(companyId, from, to);
    }
};
exports.CountsController = CountsController;
__decorate([
    (0, common_1.Post)('ingest'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.IngestCountDto]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "ingest", null);
__decorate([
    (0, common_1.Get)('query'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CountQueryDto]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "query", null);
__decorate([
    (0, common_1.Get)('kpis'),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('branchIndex')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "kpis", null);
__decorate([
    (0, common_1.Get)('compare'),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('branchIndex')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "compare", null);
__decorate([
    (0, common_1.Get)('by-branch'),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CountsController.prototype, "compareByBranch", null);
exports.CountsController = CountsController = __decorate([
    (0, common_1.Controller)('counts'),
    __metadata("design:paramtypes", [counts_service_1.CountsService])
], CountsController);
//# sourceMappingURL=counts.controller.js.map