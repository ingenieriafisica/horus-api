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
exports.CountsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("../companies/entities/company.schema");
const cameras_service_1 = require("../cameras/cameras.service");
let CountsService = class CountsService {
    constructor(countModel, camerasService) {
        this.countModel = countModel;
        this.camerasService = camerasService;
    }
    async ingest(dto) {
        const camera = await this.camerasService.validateDevice(dto.uid_hardware);
        const ts = new Date(dto.timestamp_utc);
        if (isNaN(ts.getTime())) {
            throw new common_1.BadRequestException('timestamp_utc inválido');
        }
        const windowStart = new Date(ts.getTime() - 5000);
        const windowEnd = new Date(ts.getTime() + 5000);
        const duplicate = await this.countModel.findOne({
            'meta.cameraId': camera._id,
            timestamp: { $gte: windowStart, $lte: windowEnd },
        });
        if (duplicate) {
            return { ok: true };
        }
        await new this.countModel({
            timestamp: ts,
            meta: {
                companyId: camera.companyId,
                cameraId: camera._id,
                branchIndex: camera.branchIndex,
            },
            count_in: Math.max(0, dto.count_in),
            count_out: Math.max(0, dto.count_out),
        }).save();
        return { ok: true };
    }
    async query(dto) {
        const { from, to, granularity = 'day', companyId } = dto;
        const start = new Date(from);
        const end = new Date(to);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Fechas inválidas');
        }
        const matchStage = {
            'meta.companyId': new mongoose_2.Types.ObjectId(companyId),
            timestamp: { $gte: start, $lte: end },
        };
        if (dto.branchIndex !== undefined) {
            matchStage['meta.branchIndex'] = dto.branchIndex;
        }
        if (dto.cameraId) {
            matchStage['meta.cameraId'] = new mongoose_2.Types.ObjectId(dto.cameraId);
        }
        const groupId = this.buildGroupId(granularity);
        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: groupId,
                    total_in: { $sum: '$count_in' },
                    total_out: { $sum: '$count_out' },
                    events: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
        ];
        const series = await this.countModel.aggregate(pipeline);
        const totals = series.reduce((acc, row) => {
            acc.total_in += row.total_in;
            acc.total_out += row.total_out;
            return acc;
        }, { total_in: 0, total_out: 0 });
        return { series, totals, from, to, granularity };
    }
    async getKpis(companyId, branchIndex) {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const [today, month, year] = await Promise.all([
            this.sumPeriod(companyId, startOfDay, now, branchIndex),
            this.sumPeriod(companyId, startOfMonth, now, branchIndex),
            this.sumPeriod(companyId, startOfYear, now, branchIndex),
        ]);
        const peakHour = await this.getPeakHour(companyId, startOfDay, now, branchIndex);
        return { today, month, year, peakHour, generatedAt: now };
    }
    async compare(companyId, from, to, branchIndex) {
        const start = new Date(from);
        const end = new Date(to);
        const diffMs = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - diffMs);
        const prevEnd = new Date(start);
        const [current, previous] = await Promise.all([
            this.sumPeriod(companyId, start, end, branchIndex),
            this.sumPeriod(companyId, prevStart, prevEnd, branchIndex),
        ]);
        const pct = (curr, prev) => prev === 0 ? null : +((((curr - prev) / prev) * 100).toFixed(2));
        return {
            current,
            previous,
            change_pct: {
                in: pct(current.total_in, previous.total_in),
                out: pct(current.total_out, previous.total_out),
            },
        };
    }
    async compareByBranch(companyId, from, to) {
        const pipeline = [
            {
                $match: {
                    'meta.companyId': new mongoose_2.Types.ObjectId(companyId),
                    timestamp: { $gte: new Date(from), $lte: new Date(to) },
                },
            },
            {
                $group: {
                    _id: '$meta.branchIndex',
                    total_in: { $sum: '$count_in' },
                    total_out: { $sum: '$count_out' },
                },
            },
            { $sort: { total_in: -1 } },
        ];
        return this.countModel.aggregate(pipeline);
    }
    async sumPeriod(companyId, from, to, branchIndex) {
        const match = {
            'meta.companyId': new mongoose_2.Types.ObjectId(companyId),
            timestamp: { $gte: from, $lte: to },
        };
        if (branchIndex !== undefined)
            match['meta.branchIndex'] = branchIndex;
        const [result] = await this.countModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    total_in: { $sum: '$count_in' },
                    total_out: { $sum: '$count_out' },
                },
            },
        ]);
        return result ?? { total_in: 0, total_out: 0 };
    }
    async getPeakHour(companyId, from, to, branchIndex) {
        const match = {
            'meta.companyId': new mongoose_2.Types.ObjectId(companyId),
            timestamp: { $gte: from, $lte: to },
        };
        if (branchIndex !== undefined)
            match['meta.branchIndex'] = branchIndex;
        const [result] = await this.countModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { hour: { $hour: '$timestamp' } },
                    total_in: { $sum: '$count_in' },
                },
            },
            { $sort: { total_in: -1 } },
            { $limit: 1 },
        ]);
        return result ? { hour: result._id.hour, total_in: result.total_in } : null;
    }
    buildGroupId(granularity) {
        const base = {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
        };
        switch (granularity) {
            case 'hour':
                return { ...base, day: { $dayOfMonth: '$timestamp' }, hour: { $hour: '$timestamp' } };
            case 'day':
                return { ...base, day: { $dayOfMonth: '$timestamp' } };
            case 'week':
                return { year: { $year: '$timestamp' }, week: { $week: '$timestamp' } };
            case 'month':
            default:
                return base;
        }
    }
};
exports.CountsService = CountsService;
exports.CountsService = CountsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(company_schema_1.Count.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        cameras_service_1.CamerasService])
], CountsService);
//# sourceMappingURL=counts.service.js.map