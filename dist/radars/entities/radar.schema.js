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
exports.RadarSchema = exports.Radar = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Radar = class Radar {
};
exports.Radar = Radar;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Radar.prototype, "uid_hardware", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Company' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Radar.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Radar.prototype, "branchIndex", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Radar.prototype, "nombre", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Radar.prototype, "ip_local", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 80 }),
    __metadata("design:type", Number)
], Radar.prototype, "local_api_port", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'active', enum: ['active', 'inactive', 'error', 'offline'] }),
    __metadata("design:type", String)
], Radar.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Radar.prototype, "firmware_version", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], Radar.prototype, "device_key_hash", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Radar.prototype, "last_seen", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Radar.prototype, "last_heartbeat", void 0);
exports.Radar = Radar = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'radars' })
], Radar);
exports.RadarSchema = mongoose_1.SchemaFactory.createForClass(Radar);
exports.RadarSchema.index({ companyId: 1, uid_hardware: 1 }, { unique: true });
exports.RadarSchema.index({ companyId: 1, branchIndex: 1 });
exports.RadarSchema.index({ companyId: 1, status: 1 });
exports.RadarSchema.index({ uid_hardware: 1 });
//# sourceMappingURL=radar.schema.js.map