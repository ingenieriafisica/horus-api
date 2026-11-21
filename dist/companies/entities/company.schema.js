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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanySchema = exports.Company = exports.CompanyUserSchema = exports.CompanyUser = exports.PLAN_LIMITS = exports.BranchSchema = exports.Branch = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Branch = class Branch {
};
exports.Branch = Branch;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Branch.prototype, "nombre", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Branch.prototype, "ciudad", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Branch.prototype, "direccion", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Branch.prototype, "timezone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Branch.prototype, "active", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Radar' }], default: [] }),
    __metadata("design:type", Array)
], Branch.prototype, "radars", void 0);
exports.Branch = Branch = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Branch);
exports.BranchSchema = mongoose_1.SchemaFactory.createForClass(Branch);
exports.PLAN_LIMITS = {
    starter: { maxBranches: 2, maxRadars: 4, label: 'Starter' },
    pro: { maxBranches: 10, maxRadars: 25, label: 'Pro' },
    enterprise: { maxBranches: Infinity, maxRadars: Infinity, label: 'Enterprise' },
};
let CompanyUser = class CompanyUser {
};
exports.CompanyUser = CompanyUser;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CompanyUser.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['super_admin', 'admin', 'manager', 'viewer'] }),
    __metadata("design:type", String)
], CompanyUser.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], CompanyUser.prototype, "active", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], CompanyUser.prototype, "last_login", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Number], default: [] }),
    __metadata("design:type", Array)
], CompanyUser.prototype, "branchIndexes", void 0);
exports.CompanyUser = CompanyUser = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CompanyUser);
exports.CompanyUserSchema = mongoose_1.SchemaFactory.createForClass(CompanyUser);
let Company = class Company {
};
exports.Company = Company;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Company.prototype, "nombre", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Company.prototype, "nit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Company.prototype, "dbName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'active', enum: ['active', 'suspended', 'deleted'] }),
    __metadata("design:type", String)
], Company.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['starter', 'pro', 'enterprise'], default: 'starter' }),
    __metadata("design:type", String)
], Company.prototype, "plan", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Company.prototype, "logo_url", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Company.prototype, "contacto_email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.BranchSchema], default: [] }),
    __metadata("design:type", Array)
], Company.prototype, "sedes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.CompanyUserSchema], default: [] }),
    __metadata("design:type", Array)
], Company.prototype, "users", void 0);
exports.Company = Company = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Company);
exports.CompanySchema = mongoose_1.SchemaFactory.createForClass(Company);
exports.CompanySchema.index({ status: 1 });
exports.CompanySchema.index({ 'users.email': 1 });
exports.CompanySchema.index({ 'users.email': 1, status: 1 });
//# sourceMappingURL=company.schema.js.map