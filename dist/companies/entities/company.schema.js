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
exports.CountSchema = exports.Count = exports.CompanySchema = exports.Company = exports.CompanyUserSchema = exports.CompanyUser = exports.BranchSchema = exports.Branch = exports.CameraSchema = exports.Camera = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Camera = class Camera {
};
exports.Camera = Camera;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Camera.prototype, "uid_hardware", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Company' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Camera.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Camera.prototype, "branchIndex", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Camera.prototype, "ubicacion_cam", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Camera.prototype, "ip_local", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'active' }),
    __metadata("design:type", String)
], Camera.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Camera.prototype, "firmware_version", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Camera.prototype, "last_seen", void 0);
exports.Camera = Camera = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Camera);
exports.CameraSchema = mongoose_1.SchemaFactory.createForClass(Camera);
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
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Camera' }], default: [] }),
    __metadata("design:type", Array)
], Branch.prototype, "cameras", void 0);
exports.Branch = Branch = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Branch);
exports.BranchSchema = mongoose_1.SchemaFactory.createForClass(Branch);
let CompanyUser = class CompanyUser {
};
exports.CompanyUser = CompanyUser;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CompanyUser.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['admin', 'manager', 'viewer'] }),
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
let Count = class Count {
};
exports.Count = Count;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Count.prototype, "timestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            companyId: { type: mongoose_2.Types.ObjectId, ref: 'Company', required: true },
            cameraId: { type: mongoose_2.Types.ObjectId, ref: 'Camera', required: true },
            branchIndex: { type: Number, required: true },
        },
        required: true,
    }),
    __metadata("design:type", Object)
], Count.prototype, "meta", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Count.prototype, "count_in", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Count.prototype, "count_out", void 0);
exports.Count = Count = __decorate([
    (0, mongoose_1.Schema)({
        timeseries: {
            timeField: 'timestamp',
            metaField: 'meta',
            granularity: 'seconds',
        },
        expireAfterSeconds: 60 * 60 * 24 * 365 * 3,
    })
], Count);
exports.CountSchema = mongoose_1.SchemaFactory.createForClass(Count);
//# sourceMappingURL=company.schema.js.map