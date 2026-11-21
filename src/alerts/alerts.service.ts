import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { AlertRule, AlertRuleDocument } from './entities/alert-rule.schema';
import { AlertEvent, AlertEventDocument } from './entities/alert-event.schema';
import { Radar, RadarDocument } from '../radars/entities/radar.schema';
import { Count, CountDocument } from '../counts/entities/count.schema';
import { MailService } from '../auth/mail.service';
import { AuditService } from '../audit/audit.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto } from '../common/dto';

const ALERT_COOLDOWN_SECONDS = 1800; // 30 min entre alertas repetidas por regla
const MONITOR_INTERVAL_MS    = 60_000;

@Injectable()
export class AlertsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertsService.name);
  private monitorTimer?: ReturnType<typeof setInterval>;

  constructor(
    @InjectModel(AlertRule.name)  private readonly ruleModel:  Model<AlertRuleDocument>,
    @InjectModel(AlertEvent.name) private readonly eventModel: Model<AlertEventDocument>,
    @InjectModel(Radar.name)      private readonly radarModel: Model<RadarDocument>,
    @InjectModel(Count.name)      private readonly countModel: Model<CountDocument>,
    private readonly mailService:  MailService,
    private readonly auditService: AuditService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_OFFLINE_MONITOR === 'true') {
      return;
    }
    this.monitorTimer = setInterval(() => {
      this.checkOfflineRadars().catch((e) =>
        this.logger.warn(`Error en monitor offline: ${(e as Error).message}`),
      );
    }, MONITOR_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.monitorTimer) clearInterval(this.monitorTimer);
  }

  // ─── Rules CRUD ────────────────────────────────────────────────────────────

  async createRule(
    dto: CreateAlertRuleDto,
    actor?: { email?: string; role?: string },
  ): Promise<AlertRuleDocument> {
    if (!Types.ObjectId.isValid(dto.companyId)) {
      throw new BadRequestException('companyId inválido');
    }
    const rule = await new this.ruleModel({
      ...dto,
      companyId: new Types.ObjectId(dto.companyId),
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
      resourceId: (rule._id as Types.ObjectId).toString(),
      details: { name: rule.name, type: rule.type, threshold: rule.threshold },
    });

    return rule;
  }

  async findRules(companyId: string): Promise<AlertRuleDocument[]> {
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('companyId inválido');
    return this.ruleModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .lean() as unknown as AlertRuleDocument[];
  }

  async updateRule(
    id: string,
    companyId: string,
    dto: UpdateAlertRuleDto,
    role?: string,
  ): Promise<AlertRuleDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const rule = await this.ruleModel.findById(id).exec();
    if (!rule) throw new NotFoundException(`Regla ${id} no encontrada`);
    if (role !== 'super_admin' && rule.companyId.toString() !== companyId) {
      throw new ForbiddenException('No autorizado para esta regla');
    }
    Object.assign(rule, dto);
    return rule.save();
  }

  async deleteRule(id: string, companyId: string, role?: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const rule = await this.ruleModel.findById(id).exec();
    if (!rule) throw new NotFoundException(`Regla ${id} no encontrada`);
    if (role !== 'super_admin' && rule.companyId.toString() !== companyId) {
      throw new ForbiddenException('No autorizado para esta regla');
    }
    await this.ruleModel.deleteOne({ _id: rule._id });
    return { message: `Regla ${id} eliminada` };
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  async findEvents(
    companyId: string,
    acknowledged?: boolean,
    limit = 50,
    branchIndexes?: number[],
  ): Promise<AlertEventDocument[]> {
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('companyId inválido');
    const filter: Record<string, unknown> = { companyId: new Types.ObjectId(companyId) };
    if (acknowledged !== undefined) filter.acknowledged = acknowledged;
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
      .lean() as unknown as AlertEventDocument[];
  }

  async acknowledgeEvent(
    id: string,
    companyId: string,
    actor: { email: string; role: string },
  ): Promise<AlertEventDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const ev = await this.eventModel.findById(id).exec();
    if (!ev) throw new NotFoundException(`Alerta ${id} no encontrada`);
    if (actor.role !== 'super_admin' && ev.companyId.toString() !== companyId) {
      throw new ForbiddenException('No autorizado para esta alerta');
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

  // ─── Evaluadores automáticos ───────────────────────────────────────────────

  /**
   * Evalúa reglas `max_occupancy` activas tras cada ingestión de conteos.
   * Calcula el aforo neto estimado del día (entradas - salidas) por sede/empresa.
   */
  async evaluateOccupancy(
    companyId: string,
    branchIndex: number,
    radarId: string,
  ): Promise<void> {
    const rules = await this.ruleModel
      .find({
        companyId: new Types.ObjectId(companyId),
        type: 'max_occupancy',
        active: true,
        $or: [{ branchIndex }, { branchIndex: null }, { branchIndex: { $exists: false } }],
      })
      .lean();

    if (!rules.length) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (const rule of rules) {
      const match: Record<string, unknown> = {
        'meta.companyId': new Types.ObjectId(companyId),
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
      if (netOccupancy <= rule.threshold) continue;

      const cooldownKey = `tenant:${companyId}:alert:cooldown:${rule._id}:${branchIndex}`;
      const alreadySent = await this.redis.get(cooldownKey);
      if (alreadySent) continue;

      await this.redis.setex(cooldownKey, ALERT_COOLDOWN_SECONDS, '1');

      const title = `Aforo superado: ${rule.name}`;
      const message = `La ocupación estimada (${netOccupancy} personas) superó el umbral configurado de ${rule.threshold} en la sede #${branchIndex}.`;

      await new this.eventModel({
        companyId: new Types.ObjectId(companyId),
        branchIndex,
        radarId: Types.ObjectId.isValid(radarId) ? new Types.ObjectId(radarId) : undefined,
        ruleId: rule._id,
        type: 'max_occupancy',
        severity: netOccupancy > rule.threshold * 1.2 ? 'critical' : 'warning',
        title,
        message,
        value: netOccupancy,
        threshold: rule.threshold,
      }).save();

      if (rule.notify_email && rule.email_recipients?.length) {
        await this.mailService.sendAlertEmail(
          rule.email_recipients,
          `[Horus Alerta] ${title}`,
          title,
          message,
        );
      }
    }
  }

  /**
   * Revisa radares activos sin heartbeat reciente y los marca como `offline`.
   */
  async checkOfflineRadars(): Promise<number> {
    const defaultMinutes = 15;
    const cutoff = new Date(Date.now() - defaultMinutes * 60_000);

    const staleRadars = await this.radarModel
      .find({
        status: 'active',
        last_seen: { $lt: cutoff },
      })
      .lean();

    if (!staleRadars.length) return 0;

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
      if (Date.now() - lastSeenMs < minutesLimit * 60_000) continue;

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
        await this.mailService.sendAlertEmail(
          rule.email_recipients,
          `[Horus Alerta] ${title}`,
          title,
          message,
        );
      }
    }

    if (marked > 0) {
      this.logger.warn(`Monitor offline: ${marked} radar(es) marcados como offline`);
    }
    return marked;
  }
}
