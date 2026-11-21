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
var AlertsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ioredis_1 = require("@nestjs-modules/ioredis");
const ioredis_2 = __importDefault(require("ioredis"));
const alert_rule_schema_1 = require("./entities/alert-rule.schema");
const alert_event_schema_1 = require("./entities/alert-event.schema");
const radar_schema_1 = require("../radars/entities/radar.schema");
const count_schema_1 = require("../counts/entities/count.schema");
const mail_service_1 = require("../auth/mail.service");
const audit_service_1 = require("../audit/audit.service");
const ALERT_COOLDOWN_SECONDS = 1800;
const MONITOR_INTERVAL_MS = 60_000;
let AlertsService = AlertsService_1 = class AlertsService {
    constructor(ruleModel, eventModel, radarModel, countModel, mailService, auditService, redis) {
        this.ruleModel = ruleModel;
        this.eventModel = eventModel;
        this.radarModel = radarModel;
        this.countModel = countModel;
        this.mailService = mailService;
        this.auditService = auditService;
        this.redis = redis;
        this.logger = new common_1.Logger(AlertsService_1.name);
    }
    onModuleInit() {
        if (process.env.NODE_ENV === 'test' || process.env.DISABLE_OFFLINE_MONITOR === 'true') {
            return;
        }
        this.monitorTimer = setInterval(() => {
            this.checkOfflineRadars().catch((e) => this.logger.warn(`Error en monitor offline: ${e.message}`));
        }, MONITOR_INTERVAL_MS);
    }
    onModuleDestroy() {
        if (this.monitorTimer)
            clearInterval(this.monitorTimer);
    }
    async createRule(dto, actor) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.companyId)) {
            throw new common_1.BadRequestException('companyId inválido');
        }
        const rule = await new this.ruleModel({
            ...dto,
            companyId: new mongoose_2.Types.ObjectId(dto.companyId),
            threshold: dto.threshold ?? 100,
            offline_minutes: dto.offline_minutes ?? 15,
            notify_email: dto.notify_email ?? true,
            email_recipients: dto.email_recipients ?? [],
            active: true,
        }).save();
        await this.auditService.log({
            companyId: dto.companyId,
            actorEmail: actor?.email,
            actorRole: actor?.role,
            action: 'CREATE_ALERT_RULE',
            resource: 'alert_rule',
            resourceId: rule._id.toString(),
            details: { name: rule.name, type: rule.type, threshold: rule.threshold },
        });
        return rule;
    }
    async findRules(companyId) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId))
            throw new common_1.BadRequestException('companyId inválido');
        return this.ruleModel
            .find({ companyId: new mongoose_2.Types.ObjectId(companyId) })
            .sort({ createdAt: -1 })
            .lean();
    }
    async updateRule(id, companyId, dto, role) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('ID inválido');
        const rule = await this.ruleModel.findById(id).exec();
        if (!rule)
            throw new common_1.NotFoundException(`Regla ${id} no encontrada`);
        if (role !== 'super_admin' && rule.companyId.toString() !== companyId) {
            throw new common_1.ForbiddenException('No autorizado para esta regla');
        }
        Object.assign(rule, dto);
        return rule.save();
    }
    async deleteRule(id, companyId, role) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('ID inválido');
        const rule = await this.ruleModel.findById(id).exec();
        if (!rule)
            throw new common_1.NotFoundException(`Regla ${id} no encontrada`);
        if (role !== 'super_admin' && rule.companyId.toString() !== companyId) {
            throw new common_1.ForbiddenException('No autorizado para esta regla');
        }
        await this.ruleModel.deleteOne({ _id: rule._id });
        return { message: `Regla ${id} eliminada` };
    }
    async findEvents(companyId, acknowledged, limit = 50, branchIndexes) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId))
            throw new common_1.BadRequestException('companyId inválido');
        const filter = { companyId: new mongoose_2.Types.ObjectId(companyId) };
        if (acknowledged !== undefined)
            filter.acknowledged = acknowledged;
        if (branchIndexes?.length) {
            filter.$or = [
                { branchIndex: { $in: branchIndexes } },
                { branchIndex: { $exists: false } },
                { branchIndex: null },
            ];
        }
        return this.eventModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(Math.min(limit, 200))
            .lean();
    }
    async acknowledgeEvent(id, companyId, actor) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('ID inválido');
        const ev = await this.eventModel.findById(id).exec();
        if (!ev)
            throw new common_1.NotFoundException(`Alerta ${id} no encontrada`);
        if (actor.role !== 'super_admin' && ev.companyId.toString() !== companyId) {
            throw new common_1.ForbiddenException('No autorizado para esta alerta');
        }
        ev.acknowledged = true;
        ev.acknowledged_by = actor.email;
        ev.acknowledged_at = new Date();
        const saved = await ev.save();
        await this.auditService.log({
            companyId: ev.companyId.toString(),
            actorEmail: actor.email,
            actorRole: actor.role,
            action: 'ACK_ALERT',
            resource: 'alert_event',
            resourceId: id,
        });
        return saved;
    }
    async evaluateOccupancy(companyId, branchIndex, radarId) {
        const rules = await this.ruleModel
            .find({
            companyId: new mongoose_2.Types.ObjectId(companyId),
            type: 'max_occupancy',
            active: true,
            $or: [{ branchIndex }, { branchIndex: null }, { branchIndex: { $exists: false } }],
        })
            .lean();
        if (!rules.length)
            return;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        for (const rule of rules) {
            const match = {
                'meta.companyId': new mongoose_2.Types.ObjectId(companyId),
                timestamp: { $gte: startOfDay },
            };
            if (rule.branchIndex !== undefined && rule.branchIndex !== null) {
                match['meta.branchIndex'] = rule.branchIndex;
            }
            const [agg] = await this.countModel.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        total_in: { $sum: '$count_in' },
                        total_out: { $sum: '$count_out' },
                    },
                },
            ]);
            const netOccupancy = Math.max(0, (agg?.total_in ?? 0) - (agg?.total_out ?? 0));
            if (netOccupancy <= rule.threshold)
                continue;
            const cooldownKey = `tenant:${companyId}:alert:cooldown:${rule._id}:${branchIndex}`;
            const alreadySent = await this.redis.get(cooldownKey);
            if (alreadySent)
                continue;
            await this.redis.setex(cooldownKey, ALERT_COOLDOWN_SECONDS, '1');
            const title = `Aforo superado: ${rule.name}`;
            const message = `La ocupación estimada (${netOccupancy} personas) superó el umbral configurado de ${rule.threshold} en la sede #${branchIndex}.`;
            await new this.eventModel({
                companyId: new mongoose_2.Types.ObjectId(companyId),
                branchIndex,
                radarId: mongoose_2.Types.ObjectId.isValid(radarId) ? new mongoose_2.Types.ObjectId(radarId) : undefined,
                ruleId: rule._id,
                type: 'max_occupancy',
                severity: netOccupancy > rule.threshold * 1.2 ? 'critical' : 'warning',
                title,
                message,
                value: netOccupancy,
                threshold: rule.threshold,
            }).save();
            if (rule.notify_email && rule.email_recipients?.length) {
                await this.mailService.sendAlertEmail(rule.email_recipients, `[Horus Alerta] ${title}`, title, message);
            }
        }
    }
    async checkOfflineRadars() {
        const defaultMinutes = 15;
        const cutoff = new Date(Date.now() - defaultMinutes * 60_000);
        const staleRadars = await this.radarModel
            .find({
            status: 'active',
            last_seen: { $lt: cutoff },
        })
            .lean();
        if (!staleRadars.length)
            return 0;
        let marked = 0;
        for (const radar of staleRadars) {
            const companyId = radar.companyId.toString();
            const rule = await this.ruleModel
                .findOne({
                companyId: radar.companyId,
                type: 'radar_offline',
                active: true,
                $or: [
                    { branchIndex: radar.branchIndex },
                    { branchIndex: null },
                    { branchIndex: { $exists: false } },
                ],
            })
                .lean();
            const minutesLimit = rule?.offline_minutes ?? defaultMinutes;
            const lastSeenMs = radar.last_seen ? new Date(radar.last_seen).getTime() : 0;
            if (Date.now() - lastSeenMs < minutesLimit * 60_000)
                continue;
            await this.radarModel.updateOne({ _id: radar._id }, { $set: { status: 'offline' } });
            await this.redis.del(`tenant:${companyId}:cache:radar-summary`);
            marked++;
            const title = `Radar sin conexión: ${radar.nombre}`;
            const message = `El dispositivo ${radar.uid_hardware} (sede #${radar.branchIndex}) no reporta heartbeat desde hace más de ${minutesLimit} minutos.`;
            await new this.eventModel({
                companyId: radar.companyId,
                branchIndex: radar.branchIndex,
                radarId: radar._id,
                ruleId: rule?._id,
                type: 'radar_offline',
                severity: 'critical',
                title,
                message,
                threshold: minutesLimit,
            }).save();
            if (rule?.notify_email && rule.email_recipients?.length) {
                await this.mailService.sendAlertEmail(rule.email_recipients, `[Horus Alerta] ${title}`, title, message);
            }
        }
        if (marked > 0) {
            this.logger.warn(`Monitor offline: ${marked} radar(es) marcados como offline`);
        }
        return marked;
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = AlertsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(alert_rule_schema_1.AlertRule.name)),
    __param(1, (0, mongoose_1.InjectModel)(alert_event_schema_1.AlertEvent.name)),
    __param(2, (0, mongoose_1.InjectModel)(radar_schema_1.Radar.name)),
    __param(3, (0, mongoose_1.InjectModel)(count_schema_1.Count.name)),
    __param(6, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mail_service_1.MailService,
        audit_service_1.AuditService,
        ioredis_2.default])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map