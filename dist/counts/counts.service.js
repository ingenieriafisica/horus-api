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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CountsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ioredis_1 = require("@nestjs-modules/ioredis");
const ioredis_2 = __importDefault(require("ioredis"));
const count_schema_1 = require("./entities/count.schema");
const radars_service_1 = require("../radars/radars.service");
const alerts_service_1 = require("../alerts/alerts.service");
const KPI_CACHE_TTL = 60;
const INGEST_RATE_LIMIT = 60;
const INGEST_WINDOW_SEC = 60;
let CountsService = CountsService_1 = class CountsService {
    constructor(countModel, radarsService, alertsService, redis) {
        this.countModel = countModel;
        this.radarsService = radarsService;
        this.alertsService = alertsService;
        this.redis = redis;
        this.logger = new common_1.Logger(CountsService_1.name);
    }
    async ingest(dto, bearerToken) {
        const rlKey = `ratelimit:ingest:${dto.uid_hardware}`;
        const count = await this.redis.incr(rlKey);
        if (count === 1)
            await this.redis.expire(rlKey, INGEST_WINDOW_SEC);
        if (count > INGEST_RATE_LIMIT) {
            throw new common_1.HttpException('Demasiadas peticiones desde el dispositivo (máx 60/min)', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const radar = await this.radarsService.validateDevice(dto.uid_hardware, bearerToken);
        const ts = new Date(dto.timestamp_utc);
        if (isNaN(ts.getTime()))
            throw new common_1.BadRequestException('timestamp_utc inválido');
        const windowStart = new Date(ts.getTime() - 5000);
        const windowEnd = new Date(ts.getTime() + 5000);
        const duplicate = await this.countModel.findOne({
            'meta.radarId': radar._id,
            timestamp: { $gte: windowStart, $lte: windowEnd },
        });
        if (duplicate)
            return { ok: true };
        await new this.countModel({
            timestamp: ts,
            meta: {
                companyId: radar.companyId,
                radarId: radar._id,
                branchIndex: radar.branchIndex,
            },
            count_in: Math.max(0, dto.count_in),
            count_out: Math.max(0, dto.count_out),
        }).save();
        const branchKey = `tenant:${radar.companyId}:cache:kpis:${radar.branchIndex}`;
        const globalKey = `tenant:${radar.companyId}:cache:kpis:all`;
        await this.redis.del(branchKey, globalKey);
        this.alertsService
            .evaluateOccupancy(radar.companyId.toString(), radar.branchIndex, radar._id.toString())
            .catch((e) => this.logger.warn(`Error evaluando alertas: ${e.message}`));
        return { ok: true };
    }
    async query(dto, allowedBranches) {
        const { from, to, granularity = 'day', companyId } = dto;
        if (!mongoose_2.Types.ObjectId.isValid(companyId))
            throw new common_1.BadRequestException('companyId inválido');
        const start = new Date(from);
        const end = this.endOfDay(to);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Fechas inválidas');
        }
        const matchStage = {
            'meta.companyId': new mongoose_2.Types.ObjectId(companyId),
            timestamp: { $gte: start, $lte: end },
        };
        this.applyBranchFilter(matchStage, dto.branchIndex, allowedBranches);
        if (dto.radarId) {
            if (!mongoose_2.Types.ObjectId.isValid(dto.radarId))
                throw new common_1.BadRequestException('radarId inválido');
            matchStage['meta.radarId'] = new mongoose_2.Types.ObjectId(dto.radarId);
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
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.week': 1 } },
        ];
        const series = await this.countModel.aggregate(pipeline);
        const totals = series.reduce((acc, row) => { acc.total_in += row.total_in; acc.total_out += row.total_out; return acc; }, { total_in: 0, total_out: 0 });
        return { series, totals, from, to, granularity };
    }
    async exportCsv(dto, allowedBranches) {
        const data = await this.query(dto, allowedBranches);
        const headers = ['periodo', 'granularity', 'total_in', 'total_out', 'events'];
        const rows = data.series.map((row) => {
            const id = row._id;
            let label = `${id.year}`;
            if (id.week !== undefined)
                label = `${id.year}-S${String(id.week).padStart(2, '0')}`;
            else if (id.month !== undefined && id.day !== undefined && id.hour !== undefined) {
                label = `${id.year}-${String(id.month).padStart(2, '0')}-${String(id.day).padStart(2, '0')} ${String(id.hour).padStart(2, '0')}:00`;
            }
            else if (id.month !== undefined && id.day !== undefined) {
                label = `${id.year}-${String(id.month).padStart(2, '0')}-${String(id.day).padStart(2, '0')}`;
            }
            else if (id.month !== undefined) {
                label = `${id.year}-${String(id.month).padStart(2, '0')}`;
            }
            return [label, data.granularity, row.total_in, row.total_out, row.events].join(',');
        });
        return [headers.join(','), ...rows].join('\n');
    }
    async getKpis(companyId, branchIndex, radarId, allowedBranches) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId))
            throw new common_1.BadRequestException('companyId inválido');
        const useCache = !radarId && !allowedBranches?.length;
        const cacheKey = branchIndex !== undefined
            ? `tenant:${companyId}:cache:kpis:${branchIndex}`
            : `tenant:${companyId}:cache:kpis:all`;
        if (useCache) {
            const cached = await this.redis.get(cacheKey);
            if (cached)
                return JSON.parse(cached);
        }
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const [today, month, year] = await Promise.all([
            this.sumPeriod(companyId, startOfDay, now, branchIndex, radarId, allowedBranches),
            this.sumPeriod(companyId, startOfMonth, now, branchIndex, radarId, allowedBranches),
            this.sumPeriod(companyId, startOfYear, now, branchIndex, radarId, allowedBranches),
        ]);
        const peakHour = await this.getPeakHour(companyId, startOfDay, now, branchIndex, radarId, allowedBranches);
        const result = { today, month, year, peakHour, generatedAt: now };
        if (useCache) {
            await this.redis.setex(cacheKey, KPI_CACHE_TTL, JSON.stringify(result));
        }
        return result;
    }
    async compare(companyId, from, to, branchIndex, radarId, allowedBranches) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId))
            throw new common_1.BadRequestException('companyId inválido');
        const start = new Date(from);
        const end = this.endOfDay(to);
        const diffMs = Math.max(end.getTime() - start.getTime(), 86_400_000);
        const [current, previous] = await Promise.all([
            this.sumPeriod(companyId, start, end, branchIndex, radarId, allowedBranches),
            this.sumPeriod(companyId, new Date(start.getTime() - diffMs), start, branchIndex, radarId, allowedBranches),
        ]);
        const pct = (curr, prev) => prev === 0 ? null : +((((curr - prev) / prev) * 100).toFixed(2));
        return {
            current,
            previous,
            change_pct: { in: pct(current.total_in, previous.total_in), out: pct(current.total_out, previous.total_out) },
        };
    }
    async compareByBranch(companyId, from, to, allowedBranches) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId))
            throw new common_1.BadRequestException('companyId inválido');
        const match = {
            'meta.companyId': new mongoose_2.Types.ObjectId(companyId),
            timestamp: { $gte: new Date(from), $lte: this.endOfDay(to) },
        };
        if (allowedBranches?.length) {
            match['meta.branchIndex'] = { $in: allowedBranches };
        }
        const pipeline = [
            { $match: match },
            { $group: { _id: '$meta.branchIndex', total_in: { $sum: '$count_in' }, total_out: { $sum: '$count_out' }, events: { $sum: 1 } } },
            { $sort: { total_in: -1 } },
        ];
        return this.countModel.aggregate(pipeline);
    }
    async byRadar(companyId, from, to, branchIndex, allowedBranches) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId))
            throw new common_1.BadRequestException('companyId inválido');
        const match = {
            'meta.companyId': new mongoose_2.Types.ObjectId(companyId),
            timestamp: { $gte: new Date(from), $lte: this.endOfDay(to) },
        };
        this.applyBranchFilter(match, branchIndex, allowedBranches);
        const pipeline = [
            { $match: match },
            {
                $group: {
                    _id: '$meta.radarId',
                    total_in: { $sum: '$count_in' },
                    total_out: { $sum: '$count_out' },
                    events: { $sum: 1 },
                    branchIndex: { $first: '$meta.branchIndex' },
                },
            },
            { $lookup: { from: 'radars', localField: '_id', foreignField: '_id', as: 'radar' } },
            {
                $addFields: {
                    nombre: { $ifNull: [{ $first: '$radar.nombre' }, 'Radar desconocido'] },
                    uid_hardware: { $first: '$radar.uid_hardware' },
                },
            },
            { $project: { radar: 0 } },
            { $sort: { total_in: -1 } },
        ];
        return this.countModel.aggregate(pipeline);
    }
    async byCompany(from, to) {
        const pipeline = [
            { $match: { timestamp: { $gte: new Date(from), $lte: this.endOfDay(to) } } },
            {
                $group: {
                    _id: '$meta.companyId',
                    total_in: { $sum: '$count_in' },
                    total_out: { $sum: '$count_out' },
                    events: { $sum: 1 },
                },
            },
            { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
            { $addFields: { nombre: { $ifNull: [{ $first: '$company.nombre' }, 'Empresa desconocida'] } } },
            { $project: { company: 0 } },
            { $sort: { total_in: -1 } },
        ];
        return this.countModel.aggregate(pipeline);
    }
    applyBranchFilter(match, branchIndex, allowedBranches) {
        if (branchIndex !== undefined) {
            match['meta.branchIndex'] = branchIndex;
        }
        else if (allowedBranches?.length) {
            match['meta.branchIndex'] = { $in: allowedBranches };
        }
    }
    endOfDay(to) {
        const d = new Date(to);
        if (to.length === 10)
            d.setUTCHours(23, 59, 59, 999);
        return d;
    }
    async sumPeriod(companyId, from, to, branchIndex, radarId, allowedBranches) {
        const match = {
            'meta.companyId': new mongoose_2.Types.ObjectId(companyId),
            timestamp: { $gte: from, $lte: to },
        };
        this.applyBranchFilter(match, branchIndex, allowedBranches);
        if (radarId && mongoose_2.Types.ObjectId.isValid(radarId)) {
            match['meta.radarId'] = new mongoose_2.Types.ObjectId(radarId);
        }
        const [result] = await this.countModel.aggregate([
            { $match: match },
            { $group: { _id: null, total_in: { $sum: '$count_in' }, total_out: { $sum: '$count_out' } } },
        ]);
        return result ?? { total_in: 0, total_out: 0 };
    }
    async getPeakHour(companyId, from, to, branchIndex, radarId, allowedBranches) {
        const match = {
            'meta.companyId': new mongoose_2.Types.ObjectId(companyId),
            timestamp: { $gte: from, $lte: to },
        };
        this.applyBranchFilter(match, branchIndex, allowedBranches);
        if (radarId && mongoose_2.Types.ObjectId.isValid(radarId)) {
            match['meta.radarId'] = new mongoose_2.Types.ObjectId(radarId);
        }
        const [result] = await this.countModel.aggregate([
            { $match: match },
            { $group: { _id: { hour: { $hour: '$timestamp' } }, total_in: { $sum: '$count_in' } } },
            { $sort: { total_in: -1 } },
            { $limit: 1 },
        ]);
        return result ? { hour: result._id.hour, total_in: result.total_in } : null;
    }
    buildGroupId(granularity) {
        const base = { year: { $year: '$timestamp' }, month: { $month: '$timestamp' } };
        switch (granularity) {
            case 'hour': return { ...base, day: { $dayOfMonth: '$timestamp' }, hour: { $hour: '$timestamp' } };
            case 'day': return { ...base, day: { $dayOfMonth: '$timestamp' } };
            case 'week': return { year: { $year: '$timestamp' }, week: { $week: '$timestamp' } };
            case 'month':
            default: return base;
        }
    }
};
exports.CountsService = CountsService;
exports.CountsService = CountsService = CountsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(count_schema_1.Count.name)),
    __param(3, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        radars_service_1.RadarsService,
        alerts_service_1.AlertsService,
        ioredis_2.default])
], CountsService);
//# sourceMappingURL=counts.service.js.map