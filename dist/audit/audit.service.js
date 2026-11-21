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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const audit_log_schema_1 = require("./audit-log.schema");
let AuditService = AuditService_1 = class AuditService {
    constructor(auditModel) {
        this.auditModel = auditModel;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async log(input) {
        try {
            await new this.auditModel({
                companyId: input.companyId && mongoose_2.Types.ObjectId.isValid(input.companyId)
                    ? new mongoose_2.Types.ObjectId(input.companyId)
                    : undefined,
                actorEmail: input.actorEmail ?? 'system',
                actorRole: input.actorRole ?? 'system',
                action: input.action,
                resource: input.resource,
                resourceId: input.resourceId,
                details: input.details,
            }).save();
        }
        catch (err) {
            this.logger.warn(`Error guardando audit log (${input.action}): ${err.message}`);
        }
    }
    async findLogs(companyId, limit = 50) {
        const filter = {};
        if (companyId && mongoose_2.Types.ObjectId.isValid(companyId)) {
            filter.companyId = new mongoose_2.Types.ObjectId(companyId);
        }
        return this.auditModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(Math.min(limit, 200))
            .lean();
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AuditService);
//# sourceMappingURL=audit.service.js.map