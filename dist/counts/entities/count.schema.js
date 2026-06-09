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
exports.CountSchema = exports.Count = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
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
    (0, mongoose_1.Prop)({ required: true, min: 0, default: 0 }),
    __metadata("design:type", Number)
], Count.prototype, "count_in", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, default: 0 }),
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
//# sourceMappingURL=count.schema.js.map