"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RadarsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadarsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ioredis_1 = require("@nestjs-modules/ioredis");
const ioredis_2 = __importDefault(require("ioredis"));
const crypto = __importStar(require("crypto"));
const radar_schema_1 = require("./entities/radar.schema");
const company_schema_1 = require("../companies/entities/company.schema");
const companies_service_1 = require("../companies/companies.service");
const audit_service_1 = require("../audit/audit.service");
const CACHE_TTL_SECONDS = 60;
let RadarsService = RadarsService_1 = class RadarsService {
    constructor(radarModel, companiesService, auditService, redis) {
        this.radarModel = radarModel;
        this.companiesService = companiesService;
        this.auditService = auditService;
        this.redis = redis;
        this.logger = new common_1.Logger(RadarsService_1.name);
    }
    async create(dto, actor) {
        const company = await this.companiesService.findById(dto.companyId);
        if (!company.sedes[dto.branchIndex]) {
            throw new common_1.NotFoundException(`Sede ${dto.branchIndex} no existe`);
        }
        const limits = company_schema_1.PLAN_LIMITS[company.plan] ?? company_schema_1.PLAN_LIMITS.starter;
        const activeRadarsCount = await this.radarModel.countDocuments({
            companyId: new mongoose_2.Types.ObjectId(dto.companyId),
            status: { $ne: 'inactive' },
        });
        if (activeRadarsCount >= limits.maxRadars) {
            throw new common_1.ForbiddenException(`Tu plan ${limits.label} permite máximo ${limits.maxRadars} radares activos. Actualiza tu plan para registrar más.`);
        }
        const exists = await this.radarModel
            .findOne({ companyId: new mongoose_2.Types.ObjectId(dto.companyId), uid_hardware: dto.uid_hardware })
            .lean();
        if (exists)
            throw new common_1.ConflictException(`uid_hardware '${dto.uid_hardware}' ya registrado`);
        const rawKey = this.generateDeviceKey();
        const deviceKeyHash = this.hashDeviceKey(rawKey);
        const radar = await new this.radarModel({
            ...dto,
            companyId: new mongoose_2.Types.ObjectId(dto.companyId),
            status: 'active',
            local_api_port: dto.local_api_port ?? 80,
            device_key_hash: deviceKeyHash,
        }).save();
        await this.companiesService.linkRadar(dto.companyId, dto.branchIndex, radar._id);
        await this.invalidateStatusCache(dto.companyId);
        await this.auditService.log({
            companyId: dto.companyId,
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'CREATE_RADAR',
            resource: 'radar',
            resourceId: radar._id.toString(),
            details: { uid_hardware: dto.uid_hardware, branchIndex: dto.branchIndex },
        });
        const plain = radar.toObject();
        delete plain.device_key_hash;
        return { ...plain, device_key: rawKey };
    }
    async rotateKey(id, companyId, actor) {
        const radar = await this.findAndVerifyOwnership(id, companyId, actor?.role);
        const rawKey = this.generateDeviceKey();
        radar.device_key_hash = this.hashDeviceKey(rawKey);
        await radar.save();
        await this.auditService.log({
            companyId: radar.companyId.toString(),
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'ROTATE_RADAR_KEY',
            resource: 'radar',
            resourceId: id,
        });
        return { device_key: rawKey };
    }
    async findByCompany(companyId, user) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId))
            throw new common_1.BadRequestException('companyId inválido');
        const filter = { companyId: new mongoose_2.Types.ObjectId(companyId) };
        if (user &&
            user.role !== 'admin' &&
            user.role !== 'super_admin' &&
            user.branchIndexes?.length) {
            filter.branchIndex = { $in: user.branchIndexes };
        }
        return this.radarModel.find(filter).lean();
    }
    async findByBranch(companyId, branchIndex) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId))
            throw new common_1.BadRequestException('companyId inválido');
        return this.radarModel
            .find({ companyId: new mongoose_2.Types.ObjectId(companyId), branchIndex })
            .lean();
    }
    async findById(id, companyId, role) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('ID inválido');
        const radar = await this.radarModel.findById(id).exec();
        if (!radar)
            throw new common_1.NotFoundException(`Radar ${id} no encontrado`);
        if (companyId && role !== 'super_admin' && radar.companyId.toString() !== companyId) {
            throw new common_1.ForbiddenException('No autorizado para este radar');
        }
        return radar;
    }
    async findByHardwareUid(uid) {
        return this.radarModel.findOne({ uid_hardware: uid }).exec();
    }
    async update(id, dto, companyId, role) {
        const radar = await this.findById(id, companyId, role);
        Object.assign(radar, dto);
        const updated = await radar.save();
        await this.invalidateStatusCache(radar.companyId.toString());
        return updated;
    }
    async deactivate(id, companyId, actor) {
        const radar = await this.findById(id, companyId, actor?.role);
        radar.status = 'inactive';
        await radar.save();
        await this.companiesService.unlinkRadar(radar.companyId.toString(), radar.branchIndex, radar._id);
        await this.invalidateStatusCache(radar.companyId.toString());
        await this.auditService.log({
            companyId: radar.companyId.toString(),
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'DEACTIVATE_RADAR',
            resource: 'radar',
            resourceId: id,
        });
        return { message: `Radar ${id} desactivado` };
    }
    async heartbeat(dto, bearerToken) {
        const radar = await this.validateDevice(dto.uid_hardware, bearerToken, true);
        const update = {
            last_seen: new Date(),
            last_heartbeat: {
                wifi_rssi: dto.wifi_rssi,
                heap_free: dto.heap_free,
                uptime_s: dto.uptime_s,
                detections_total: dto.detections_total,
            },
        };
        if (dto.ip_local)
            update.ip_local = dto.ip_local;
        if (dto.firmware_version)
            update.firmware_version = dto.firmware_version;
        if (dto.local_api_port)
            update.local_api_port = dto.local_api_port;
        if (radar.status === 'error' || radar.status === 'offline') {
            update.status = 'active';
        }
        await this.radarModel.findByIdAndUpdate(radar._id, { $set: update });
        if (update.status === 'active') {
            await this.invalidateStatusCache(radar.companyId.toString());
        }
        const cacheKey = `tenant:${radar.companyId}:radar:${radar._id}:heartbeat`;
        await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify({
            ip_local: dto.ip_local ?? radar.ip_local,
            status: update.status ?? radar.status,
            last_seen: update.last_seen,
            ...update.last_heartbeat,
        }));
        return { status: update.status ?? radar.status };
    }
    async getStatusSummary(companyId) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId))
            throw new common_1.BadRequestException('companyId inválido');
        const cacheKey = `tenant:${companyId}:cache:radar-summary`;
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const pipeline = [
            { $match: { companyId: new mongoose_2.Types.ObjectId(companyId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ];
        const result = await this.radarModel.aggregate(pipeline);
        const summary = { active: 0, inactive: 0, error: 0, offline: 0 };
        result.forEach((r) => (summary[r._id] = r.count));
        await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(summary));
        return summary;
    }
    async validateDevice(uid_hardware, bearerToken, allowOfflineRecovery = false) {
        const statusFilter = allowOfflineRecovery ? { $ne: 'inactive' } : 'active';
        const radar = await this.radarModel
            .findOne({ uid_hardware, status: statusFilter })
            .select('+device_key_hash')
            .exec();
        if (!radar)
            throw new common_1.UnauthorizedException('Dispositivo no registrado o inactivo');
        const requireStrictAuth = process.env.REQUIRE_DEVICE_AUTH === 'true';
        if (requireStrictAuth && !bearerToken) {
            throw new common_1.UnauthorizedException('Falta Authorization: Bearer <device_key>');
        }
        if (radar.device_key_hash && (bearerToken || requireStrictAuth)) {
            if (!bearerToken) {
                throw new common_1.UnauthorizedException('Device API key requerida');
            }
            const incomingHash = this.hashDeviceKey(bearerToken);
            const a = Buffer.from(incomingHash, 'hex');
            const b = Buffer.from(radar.device_key_hash, 'hex');
            if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
                throw new common_1.UnauthorizedException('Device API key inválida');
            }
        }
        return radar;
    }
    async probeRealtime(radarId, companyId, role) {
        const radar = await this.findAndVerifyOwnership(radarId, companyId, role);
        const live = this.normalizeRadar(await this.callLocalApi(radar, '/api/radar'));
        const data = live ?? (await this.getHeartbeatCache(radar));
        return {
            source: live ? 'live' : 'cached',
            radar: {
                ...data,
                ip_local: radar.ip_local,
                status: radar.status,
                nombre: radar.nombre,
            },
        };
    }
    async probeStats(radarId, companyId, role) {
        const radar = await this.findAndVerifyOwnership(radarId, companyId, role);
        const live = this.normalizeRadar(await this.callLocalApi(radar, '/api/stats'));
        const data = live ?? (await this.getHeartbeatCache(radar));
        return { source: live ? 'live' : 'cached', data };
    }
    async probeHealth(radarId, companyId, role) {
        const radar = await this.findAndVerifyOwnership(radarId, companyId, role);
        const live = this.normalizeRadar(await this.callLocalApi(radar, '/api/health'));
        return {
            radarId: radar._id,
            nombre: radar.nombre,
            status: radar.status,
            last_seen: radar.last_seen,
            reachable: !!live,
            live,
        };
    }
    async findAndVerifyOwnership(radarId, companyId, role) {
        return this.findById(radarId, companyId, role);
    }
    generateDeviceKey() {
        return `horus_dev_${crypto.randomBytes(24).toString('hex')}`;
    }
    hashDeviceKey(rawKey) {
        return crypto.createHash('sha256').update(rawKey).digest('hex');
    }
    async getHeartbeatCache(radar) {
        const key = `tenant:${radar.companyId}:radar:${radar._id}:heartbeat`;
        const cached = await this.redis.get(key);
        if (cached)
            return this.normalizeRadar(JSON.parse(cached));
        return this.normalizeRadar({ last_seen: radar.last_seen, ...(radar.last_heartbeat ?? {}) });
    }
    normalizeRadar(raw) {
        if (!raw || typeof raw !== 'object')
            return null;
        const r = raw;
        return {
            presence: r.presence ?? null,
            detections: r.detections ?? r.detections_total ?? null,
            lastDetection: r.lastDetection ?? null,
            wifi_rssi: r.wifi_rssi ?? null,
            heap_free: r.heap ?? r.heap_free ?? null,
            uptime_s: r.uptime ?? r.uptime_s ?? null,
            last_seen: r.last_seen ?? null,
        };
    }
    async callLocalApi(radar, path) {
        const url = `http://${radar.ip_local}:${radar.local_api_port ?? 80}${path}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok)
                return null;
            return await res.json();
        }
        catch {
            this.logger.debug(`ESP32 no alcanzable: ${url}`);
            return null;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async invalidateStatusCache(companyId) {
        await this.redis.del(`tenant:${companyId}:cache:radar-summary`);
    }
};
exports.RadarsService = RadarsService;
exports.RadarsService = RadarsService = RadarsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(radar_schema_1.Radar.name)),
    __param(3, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        companies_service_1.CompaniesService,
        audit_service_1.AuditService,
        ioredis_2.default])
], RadarsService);
//# sourceMappingURL=radars.service.js.map