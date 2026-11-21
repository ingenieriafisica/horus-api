import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import { Radar, RadarDocument } from './entities/radar.schema';
import { PLAN_LIMITS } from '../companies/entities/company.schema';
import { CompaniesService } from '../companies/companies.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateRadarDto,
  UpdateRadarDto,
  HeartbeatDto,
} from '../common/dto';

const CACHE_TTL_SECONDS = 60; // caché de estado 1 minuto

@Injectable()
export class RadarsService {
  private readonly logger = new Logger(RadarsService.name);

  constructor(
    @InjectModel(Radar.name)
    private readonly radarModel: Model<RadarDocument>,
    private readonly companiesService: CompaniesService,
    private readonly auditService: AuditService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ─── Registro ──────────────────────────────────────────────────────────────

  async create(
    dto: CreateRadarDto,
    actor?: { email?: string; role?: string },
  ): Promise<Record<string, unknown>> {
    const company = await this.companiesService.findById(dto.companyId);
    if (!company.sedes[dto.branchIndex]) {
      throw new NotFoundException(`Sede ${dto.branchIndex} no existe`);
    }

    const limits = PLAN_LIMITS[company.plan] ?? PLAN_LIMITS.starter;
    const activeRadarsCount = await this.radarModel.countDocuments({
      companyId: new Types.ObjectId(dto.companyId),
      status: { $ne: 'inactive' },
    });
    if (activeRadarsCount >= limits.maxRadars) {
      throw new ForbiddenException(
        `Tu plan ${limits.label} permite máximo ${limits.maxRadars} radares activos. Actualiza tu plan para registrar más.`,
      );
    }

    const exists = await this.radarModel
      .findOne({ companyId: new Types.ObjectId(dto.companyId), uid_hardware: dto.uid_hardware })
      .lean();
    if (exists) throw new ConflictException(`uid_hardware '${dto.uid_hardware}' ya registrado`);

    const rawKey = this.generateDeviceKey();
    const deviceKeyHash = this.hashDeviceKey(rawKey);

    const radar = await new this.radarModel({
      ...dto,
      companyId: new Types.ObjectId(dto.companyId),
      status: 'active',
      local_api_port: dto.local_api_port ?? 80,
      device_key_hash: deviceKeyHash,
    }).save();

    await this.companiesService.linkRadar(
      dto.companyId,
      dto.branchIndex,
      radar._id as Types.ObjectId,
    );

    await this.invalidateStatusCache(dto.companyId);
    await this.auditService.log({
      companyId: dto.companyId,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'CREATE_RADAR',
      resource: 'radar',
      resourceId: (radar._id as Types.ObjectId).toString(),
      details: { uid_hardware: dto.uid_hardware, branchIndex: dto.branchIndex },
    });

    const plain = radar.toObject();
    delete (plain as any).device_key_hash;
    // Devuelve device_key una sola vez para provisionar el ESP32
    return { ...plain, device_key: rawKey };
  }

  async rotateKey(
    id: string,
    companyId: string,
    actor?: { email?: string; role?: string },
  ): Promise<{ device_key: string }> {
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

  // ─── Consultas ─────────────────────────────────────────────────────────────

  async findByCompany(
    companyId: string,
    user?: { role?: string; branchIndexes?: number[] },
  ): Promise<RadarDocument[]> {
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('companyId inválido');
    const filter: Record<string, unknown> = { companyId: new Types.ObjectId(companyId) };
    if (
      user &&
      user.role !== 'admin' &&
      user.role !== 'super_admin' &&
      user.branchIndexes?.length
    ) {
      filter.branchIndex = { $in: user.branchIndexes };
    }
    return this.radarModel.find(filter).lean() as unknown as RadarDocument[];
  }

  async findByBranch(companyId: string, branchIndex: number): Promise<RadarDocument[]> {
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('companyId inválido');
    return this.radarModel
      .find({ companyId: new Types.ObjectId(companyId), branchIndex })
      .lean() as unknown as RadarDocument[];
  }

  async findById(
    id: string,
    companyId?: string,
    role?: string,
  ): Promise<RadarDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const radar = await this.radarModel.findById(id).exec();
    if (!radar) throw new NotFoundException(`Radar ${id} no encontrado`);
    if (companyId && role !== 'super_admin' && radar.companyId.toString() !== companyId) {
      throw new ForbiddenException('No autorizado para este radar');
    }
    return radar;
  }

  async findByHardwareUid(uid: string): Promise<RadarDocument | null> {
    return this.radarModel.findOne({ uid_hardware: uid }).exec();
  }

  // ─── Actualización ─────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateRadarDto,
    companyId: string,
    role?: string,
  ): Promise<RadarDocument> {
    const radar = await this.findById(id, companyId, role);
    Object.assign(radar, dto);
    const updated = await radar.save();
    await this.invalidateStatusCache(radar.companyId.toString());
    return updated;
  }

  async deactivate(
    id: string,
    companyId: string,
    actor?: { email?: string; role?: string },
  ): Promise<{ message: string }> {
    const radar = await this.findById(id, companyId, actor?.role);
    radar.status = 'inactive';
    await radar.save();

    await this.companiesService.unlinkRadar(
      radar.companyId.toString(),
      radar.branchIndex,
      radar._id as Types.ObjectId,
    );
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

  // ─── Heartbeat (llamado por el ESP32 cada ~5 min) ─────────────────────────

  async heartbeat(dto: HeartbeatDto, bearerToken?: string): Promise<{ status: string }> {
    const radar = await this.validateDevice(dto.uid_hardware, bearerToken, true);

    const update: Partial<Radar> = {
      last_seen: new Date(),
      last_heartbeat: {
        wifi_rssi:         dto.wifi_rssi,
        heap_free:         dto.heap_free,
        uptime_s:          dto.uptime_s,
        detections_total:  dto.detections_total,
      },
    };
    if (dto.ip_local)         update.ip_local         = dto.ip_local;
    if (dto.firmware_version) update.firmware_version = dto.firmware_version;
    if (dto.local_api_port)   update.local_api_port   = dto.local_api_port;
    if (radar.status === 'error' || radar.status === 'offline') {
      update.status = 'active'; // auto-recovery
    }

    await this.radarModel.findByIdAndUpdate(radar._id, { $set: update });
    if (update.status === 'active') {
      await this.invalidateStatusCache(radar.companyId.toString());
    }

    // Cachear estado del radar en Redis para respuestas rápidas al dashboard
    const cacheKey = `tenant:${radar.companyId}:radar:${radar._id}:heartbeat`;
    await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify({
      ip_local:    dto.ip_local ?? radar.ip_local,
      status:      update.status ?? radar.status,
      last_seen:   update.last_seen,
      ...update.last_heartbeat,
    }));

    return { status: update.status ?? radar.status };
  }

  // ─── Estado del sistema ────────────────────────────────────────────────────

  async getStatusSummary(companyId: string) {
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('companyId inválido');
    const cacheKey = `tenant:${companyId}:cache:radar-summary`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const pipeline = [
      { $match: { companyId: new Types.ObjectId(companyId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ];
    const result = await this.radarModel.aggregate(pipeline);
    const summary: Record<string, number> = { active: 0, inactive: 0, error: 0, offline: 0 };
    result.forEach((r) => (summary[r._id] = r.count));

    await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(summary));
    return summary;
  }

  /**
   * Valida que el uid_hardware pertenece a un radar registrado (y activo para ingestión).
   * Si el dispositivo tiene `device_key_hash` y se exige o se envía Bearer token, verifica su hash.
   */
  async validateDevice(
    uid_hardware: string,
    bearerToken?: string,
    allowOfflineRecovery = false,
  ): Promise<RadarDocument> {
    const statusFilter = allowOfflineRecovery ? { $ne: 'inactive' } : 'active';
    const radar = await this.radarModel
      .findOne({ uid_hardware, status: statusFilter })
      .select('+device_key_hash')
      .exec();

    if (!radar) throw new UnauthorizedException('Dispositivo no registrado o inactivo');

    const requireStrictAuth = process.env.REQUIRE_DEVICE_AUTH === 'true';
    if (requireStrictAuth && !bearerToken) {
      throw new UnauthorizedException('Falta Authorization: Bearer <device_key>');
    }
    if (radar.device_key_hash && (bearerToken || requireStrictAuth)) {
      if (!bearerToken) {
        throw new UnauthorizedException('Device API key requerida');
      }
      const incomingHash = this.hashDeviceKey(bearerToken);
      const a = Buffer.from(incomingHash, 'hex');
      const b = Buffer.from(radar.device_key_hash, 'hex');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new UnauthorizedException('Device API key inválida');
      }
    }

    return radar;
  }

  // ─── Proxy a la API local del ESP32 ────────────────────────────────────────

  async probeRealtime(radarId: string, companyId: string, role?: string) {
    const radar = await this.findAndVerifyOwnership(radarId, companyId, role);
    const live  = this.normalizeRadar(await this.callLocalApi(radar, '/api/radar'));
    const data  = live ?? (await this.getHeartbeatCache(radar));
    return {
      source: live ? 'live' : 'cached',
      radar: {
        ...data,
        ip_local: radar.ip_local,
        status:   radar.status,
        nombre:   radar.nombre,
      },
    };
  }

  async probeStats(radarId: string, companyId: string, role?: string) {
    const radar = await this.findAndVerifyOwnership(radarId, companyId, role);
    const live  = this.normalizeRadar(await this.callLocalApi(radar, '/api/stats'));
    const data  = live ?? (await this.getHeartbeatCache(radar));
    return { source: live ? 'live' : 'cached', data };
  }

  async probeHealth(radarId: string, companyId: string, role?: string) {
    const radar = await this.findAndVerifyOwnership(radarId, companyId, role);
    const live  = this.normalizeRadar(await this.callLocalApi(radar, '/api/health'));
    return {
      radarId:   radar._id,
      nombre:    radar.nombre,
      status:    radar.status,
      last_seen: radar.last_seen,
      reachable: !!live,
      live,
    };
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────

  private async findAndVerifyOwnership(radarId: string, companyId: string, role?: string) {
    return this.findById(radarId, companyId, role);
  }

  private generateDeviceKey(): string {
    return `horus_dev_${crypto.randomBytes(24).toString('hex')}`;
  }

  private hashDeviceKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  private async getHeartbeatCache(radar: RadarDocument) {
    const key    = `tenant:${radar.companyId}:radar:${radar._id}:heartbeat`;
    const cached = await this.redis.get(key);
    if (cached) return this.normalizeRadar(JSON.parse(cached));
    return this.normalizeRadar({ last_seen: radar.last_seen, ...(radar.last_heartbeat ?? {}) });
  }

  private normalizeRadar(raw: unknown): {
    presence: boolean | null;
    detections: number | null;
    lastDetection: number | null;
    wifi_rssi: number | null;
    heap_free: number | null;
    uptime_s: number | null;
    last_seen?: Date | null;
  } | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, any>;
    return {
      presence:      r.presence ?? null,
      detections:    r.detections ?? r.detections_total ?? null,
      lastDetection: r.lastDetection ?? null,
      wifi_rssi:     r.wifi_rssi ?? null,
      heap_free:     r.heap ?? r.heap_free ?? null,
      uptime_s:      r.uptime ?? r.uptime_s ?? null,
      last_seen:     r.last_seen ?? null,
    };
  }

  private async callLocalApi(radar: RadarDocument, path: string): Promise<unknown | null> {
    const url = `http://${radar.ip_local}:${radar.local_api_port ?? 80}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      this.logger.debug(`ESP32 no alcanzable: ${url}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async invalidateStatusCache(companyId: string) {
    await this.redis.del(`tenant:${companyId}:cache:radar-summary`);
  }
}
