import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Radar, RadarDocument } from './entities/radar.schema';
import { CompaniesService } from '../companies/companies.service';
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
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ─── Registro ──────────────────────────────────────────────────────────────

  async create(dto: CreateRadarDto): Promise<RadarDocument> {
    const company = await this.companiesService.findById(dto.companyId);
    if (!company.sedes[dto.branchIndex]) {
      throw new NotFoundException(`Sede ${dto.branchIndex} no existe`);
    }

    const exists = await this.radarModel
      .findOne({ companyId: new Types.ObjectId(dto.companyId), uid_hardware: dto.uid_hardware })
      .lean();
    if (exists) throw new ConflictException(`uid_hardware '${dto.uid_hardware}' ya registrado`);

    const radar = await new this.radarModel({
      ...dto,
      companyId: new Types.ObjectId(dto.companyId),
      status: 'active',
      local_api_port: dto.local_api_port ?? 80,
    }).save();

    await this.companiesService.linkRadar(
      dto.companyId,
      dto.branchIndex,
      radar._id as Types.ObjectId,
    );

    await this.invalidateStatusCache(dto.companyId);
    return radar;
  }

  // ─── Consultas ─────────────────────────────────────────────────────────────

  async findByCompany(companyId: string): Promise<RadarDocument[]> {
    return this.radarModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .lean() as unknown as RadarDocument[];
  }

  async findByBranch(companyId: string, branchIndex: number): Promise<RadarDocument[]> {
    return this.radarModel
      .find({ companyId: new Types.ObjectId(companyId), branchIndex })
      .lean() as unknown as RadarDocument[];
  }

  async findById(id: string): Promise<RadarDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const radar = await this.radarModel.findById(id).exec();
    if (!radar) throw new NotFoundException(`Radar ${id} no encontrado`);
    return radar;
  }

  async findByHardwareUid(uid: string): Promise<RadarDocument | null> {
    return this.radarModel.findOne({ uid_hardware: uid }).exec();
  }

  // ─── Actualización ─────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateRadarDto): Promise<RadarDocument> {
    const radar = await this.findById(id);
    Object.assign(radar, dto);
    const updated = await radar.save();
    await this.invalidateStatusCache(radar.companyId.toString());
    return updated;
  }

  async deactivate(id: string, companyId: string): Promise<{ message: string }> {
    const radar = await this.findById(id);
    if (radar.companyId.toString() !== companyId) {
      throw new UnauthorizedException('No autorizado para este radar');
    }
    radar.status = 'inactive';
    await radar.save();

    await this.companiesService.unlinkRadar(
      companyId,
      radar.branchIndex,
      radar._id as Types.ObjectId,
    );
    await this.invalidateStatusCache(companyId);
    return { message: `Radar ${id} desactivado` };
  }

  // ─── Heartbeat (llamado por el ESP32 cada ~5 min) ─────────────────────────

  async heartbeat(dto: HeartbeatDto): Promise<{ status: string }> {
    const radar = await this.radarModel.findOne({ uid_hardware: dto.uid_hardware });
    if (!radar) throw new UnauthorizedException('Dispositivo no registrado');

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

  /** Valida que el uid_hardware pertenece a un radar activo (para ingestión de conteos) */
  async validateDevice(uid_hardware: string): Promise<RadarDocument> {
    const radar = await this.radarModel.findOne({ uid_hardware, status: 'active' });
    if (!radar) throw new UnauthorizedException('Dispositivo no registrado o inactivo');
    return radar;
  }

  // ─── Proxy a la API local del ESP32 ────────────────────────────────────────
  // El ESP32 expone un servidor HTTP en su IP local. El dashboard puede pedir
  // datos en tiempo real a través de este proxy cuando ambos están en la misma red.
  // Si el ESP32 no es alcanzable, devuelve los últimos datos del heartbeat (Redis).

  async probeRealtime(radarId: string, companyId: string) {
    const radar = await this.findAndVerifyOwnership(radarId, companyId);
    const cached = await this.getHeartbeatCache(radar);
    const live   = await this.callLocalApi(radar, '/api/radar');
    return { source: live ? 'live' : 'cached', radar: live ?? cached };
  }

  async probeStats(radarId: string, companyId: string) {
    const radar = await this.findAndVerifyOwnership(radarId, companyId);
    const live  = await this.callLocalApi(radar, '/api/stats');
    if (!live) {
      const cached = await this.getHeartbeatCache(radar);
      return { source: 'cached', data: cached };
    }
    return { source: 'live', data: live };
  }

  async probeHealth(radarId: string, companyId: string) {
    const radar = await this.findAndVerifyOwnership(radarId, companyId);
    const live  = await this.callLocalApi(radar, '/api/health');
    return {
      radarId:    radar._id,
      nombre:     radar.nombre,
      status:     radar.status,
      last_seen:  radar.last_seen,
      reachable:  !!live,
      live,
    };
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────

  private async findAndVerifyOwnership(radarId: string, companyId: string) {
    const radar = await this.findById(radarId);
    if (radar.companyId.toString() !== companyId) {
      throw new UnauthorizedException('No autorizado para este radar');
    }
    return radar;
  }

  private async getHeartbeatCache(radar: RadarDocument) {
    const key    = `tenant:${radar.companyId}:radar:${radar._id}:heartbeat`;
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);
    return {
      ip_local:   radar.ip_local,
      status:     radar.status,
      last_seen:  radar.last_seen,
      ...radar.last_heartbeat,
    };
  }

  /**
   * Llama a la API HTTP del ESP32 en su red local.
   * Timeout de 3 segundos. Devuelve null si no es alcanzable.
   */
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

  private async invalidateStatusCache(companyId: string) {
    await this.redis.del(`tenant:${companyId}:cache:radar-summary`);
  }
}
