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
exports.AlertEventSchema = exports.AlertEvent = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let AlertEvent = class AlertEvent {
};
exports.AlertEvent = AlertEvent;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Company', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AlertEvent.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], AlertEvent.prototype, "branchIndex", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Radar' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AlertEvent.prototype, "radarId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AlertRule' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AlertEvent.prototype, "ruleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['max_occupancy', 'radar_offline'] }),
    __metadata("design:type", String)
], AlertEvent.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['warning', 'critical'], default: 'warning' }),
    __metadata("design:type", String)
], AlertEvent.prototype, "severity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AlertEvent.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AlertEvent.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], AlertEvent.prototype, "value", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], AlertEvent.prototype, "threshold", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AlertEvent.prototype, "acknowledged", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AlertEvent.prototype, "acknowledged_by", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], AlertEvent.prototype, "acknowledged_at", void 0);
exports.AlertEvent = AlertEvent = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'alert_events' })
], AlertEvent);
exports.AlertEventSchema = mongoose_1.SchemaFactory.createForClass(AlertEvent);
exports.AlertEventSchema.index({ companyId: 1, createdAt: -1 });
exports.AlertEventSchema.index({ companyId: 1, acknowledged: 1, createdAt: -1 });
//# sourceMappingURL=alert-event.schema.js.map