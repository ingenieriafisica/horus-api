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
exports.AlertRuleSchema = exports.AlertRule = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let AlertRule = class AlertRule {
};
exports.AlertRule = AlertRule;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Company', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AlertRule.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], AlertRule.prototype, "branchIndex", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AlertRule.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['max_occupancy', 'radar_offline'] }),
    __metadata("design:type", String)
], AlertRule.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 100 }),
    __metadata("design:type", Number)
], AlertRule.prototype, "threshold", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 15 }),
    __metadata("design:type", Number)
], AlertRule.prototype, "offline_minutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], AlertRule.prototype, "notify_email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], AlertRule.prototype, "email_recipients", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], AlertRule.prototype, "active", void 0);
exports.AlertRule = AlertRule = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'alert_rules' })
], AlertRule);
exports.AlertRuleSchema = mongoose_1.SchemaFactory.createForClass(AlertRule);
exports.AlertRuleSchema.index({ companyId: 1, active: 1 });
//# sourceMappingURL=alert-rule.schema.js.map