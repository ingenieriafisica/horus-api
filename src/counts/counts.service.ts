import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Count, CountDocument } from './entities/count.schema';
import { RadarsService } from '../radars/radars.service';
import { AlertsService } from '../alerts/alerts.service';
import { IngestCountDto, CountQueryDto } from '../common/dto';

type Granularity = 'hour' | 'day' | 'week' | 'month';

const KPI_CACHE_TTL       = 60; // segundos
const INGEST_RATE_LIMIT   = 60; // máximo 60 req/min por dispositivo
const INGEST_WINDOW_SEC   = 60;

@Injectable()
export class CountsService {
  private readonly logger = new Logger(CountsService.name);

  constructor(
    @InjectModel(Count.name)
    private readonly countModel: Model<CountDocument>,
    private readonly radarsService: RadarsService,
    private readonly alertsService: AlertsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ─── Ingestión (llamado por el ESP32) ─────────────────────────────────────

  async ingest(dto: IngestCountDto, bearerToken?: string): Promise<{ ok: boolean }> {
    // Rate limiting por dispositivo: 60 req/min
    const rlKey = `ratelimit:ingest:${dto.uid_hardware}`;
    const count = await this.redis.incr(rlKey);
    if (count === 1) await this.redis.expire(rlKey, INGEST_WINDOW_SEC);
    if (count > INGEST_RATE_LIMIT) {
      throw new HttpException(
        'Demasiadas peticiones desde el dispositivo (máx 60/min)',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const radar = await this.radarsService.validateDevice(dto.uid_hardware, bearerToken);

    const ts = new Date(dto.timestamp_utc);
    if (isNaN(ts.getTime())) throw new BadRequestException('timestamp_utc inválido');

    // Deduplicación: ventana de 5 segundos por radar
    const windowStart = new Date(ts.getTime() - 5000);
    const windowEnd   = new Date(ts.getTime() + 5000);
    const duplicate   = await this.countModel.findOne({
      'meta.radarId': radar._id,
      timestamp: { $gte: windowStart, $lte: windowEnd },
    });
    if (duplicate) return { ok: true };

    await new this.countModel({
      timestamp: ts,
      meta: {
        companyId:   radar.companyId,
        radarId:     radar._id,
        branchIndex: radar.branchIndex,
      },
      count_in:  Math.max(0, dto.count_in),
      count_out: Math.max(0, dto.count_out),
    }).save();

    // Invalidar caché de KPIs del tenant tras nueva ingestión
    const branchKey = `tenant:${radar.companyId}:cache:kpis:${radar.branchIndex}`;
    const globalKey = `tenant:${radar.companyId}:cache:kpis:all`;
    await this.redis.del(branchKey, globalKey);

    // Evaluar reglas de aforo máximo sin bloquear respuesta IoT
    this.alertsService
      .evaluateOccupancy(
        radar.companyId.toString(),
        radar.branchIndex,
        (radar._id as Types.ObjectId).toString(),
      )
      .catch((e) => this.logger.warn(`Error evaluando alertas: ${(e as Error).message}`));

    return { ok: true };
  }

  // ─── Consultas de analytics ────────────────────────────────────────────────

  async query(dto: CountQueryDto, allowedBranches?: number[]) {
    const { from, to, granularity = 'day', companyId } = dto;
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('companyId inválido');

    const start = new Date(from);
    const end   = this.endOfDay(to);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    const matchStage: Record<string, unknown> = {
      'meta.companyId': new Types.ObjectId(companyId),
      timestamp: { $gte: start, $lte: end },
    };

    this.applyBranchFilter(matchStage, dto.branchIndex, allowedBranches);
    if (dto.radarId) {
      if (!Types.ObjectId.isValid(dto.radarId)) throw new BadRequestException('radarId inválido');
      matchStage['meta.radarId'] = new Types.ObjectId(dto.radarId);
    }

    const groupId = this.buildGroupId(granularity as Granularity);

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      {
        $group: {
          _id:       groupId,
          total_in:  { $sum: '$count_in' },
          total_out: { $sum: '$count_out' },
          events:    { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.week': 1 } },
    ];

    const series = await this.countModel.aggregate(pipeline);

    const totals = series.reduce(
      (acc, row) => { acc.total_in += row.total_in; acc.total_out += row.total_out; return acc; },
      { total_in: 0, total_out: 0 },
    );

    return { series, totals, from, to, granularity };
  }

  /** Exporta las series agregadas en CSV */
  async exportCsv(dto: CountQueryDto, allowedBranches?: number[]): Promise<string> {
    const data = await this.query(dto, allowedBranches);
    const headers = ['periodo', 'granularity', 'total_in', 'total_out', 'events'];
    const rows = data.series.map((row: any) => {
      const id = row._id;
      let label = `${id.year}`;
      if (id.week !== undefined) label = `${id.year}-S${String(id.week).padStart(2, '0')}`;
      else if (id.month !== undefined && id.day !== undefined && id.hour !== undefined) {
        label = `${id.year}-${String(id.month).padStart(2, '0')}-${String(id.day).padStart(2, '0')} ${String(id.hour).padStart(2, '0')}:00`;
      } else if (id.month !== undefined && id.day !== undefined) {
        label = `${id.year}-${String(id.month).padStart(2, '0')}-${String(id.day).padStart(2, '0')}`;
      } else if (id.month !== undefined) {
        label = `${id.year}-${String(id.month).padStart(2, '0')}`;
      }
      return [label, data.granularity, row.total_in, row.total_out, row.events].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  /** KPIs con caché Redis por tenant+sede (TTL 60s) */
  async getKpis(
    companyId: string,
    branchIndex?: number,
    radarId?: string,
    allowedBranches?: number[],
  ) {
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('companyId inválido');
    const useCache = !radarId && !allowedBranches?.length;
    const cacheKey = branchIndex !== undefined
      ? `tenant:${companyId}:cache:kpis:${branchIndex}`
      : `tenant:${companyId}:cache:kpis:all`;

    if (useCache) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const now          = new Date();
    const startOfDay   = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    const [today, month, year] = await Promise.all([
      this.sumPeriod(companyId, startOfDay,   now, branchIndex, radarId, allowedBranches),
      this.sumPeriod(companyId, startOfMonth, now, branchIndex, radarId, allowedBranches),
      this.sumPeriod(companyId, startOfYear,  now, branchIndex, radarId, allowedBranches),
    ]);

    const peakHour = await this.getPeakHour(companyId, startOfDay, now, branchIndex, radarId, allowedBranches);
    const result   = { today, month, year, peakHour, generatedAt: now };

    if (useCache) {
      await this.redis.setex(cacheKey, KPI_CACHE_TTL, JSON.stringify(result));
    }
    return result;
  }

  async compare(
    companyId: string,
    from: string,
    to: string,
    branchIndex?: number,
    radarId?: string,
    allowedBranches?: number[],
  ) {
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('companyId inválido');
    const start  = new Date(from);
    const end    = this.endOfDay(to);
    const diffMs = Math.max(end.getTime() - start.getTime(), 86_400_000);

    const [current, previous] = await Promise.all([
      this.sumPeriod(companyId, start,                              end,   branchIndex, radarId, allowedBranches),
      this.sumPeriod(companyId, new Date(start.getTime() - diffMs), start, branchIndex, radarId, allowedBranches),
    ]);

    const pct = (curr: number, prev: number) =>
      prev === 0 ? null : +((((curr - prev) / prev) * 100).toFixed(2));

    return {
      current,
      previous,
      change_pct: { in: pct(current.total_in, previous.total_in), out: pct(current.total_out, previous.total_out) },
    };
  }

  /** Conteos discriminados por SEDE dentro de una empresa. */
  async compareByBranch(
    companyId: string,
    from: string,
    to: string,
    allowedBranches?: number[],
  ) {
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('companyId inválido');
    const match: Record<string, unknown> = {
      'meta.companyId': new Types.ObjectId(companyId),
      timestamp: { $gte: new Date(from), $lte: this.endOfDay(to) },
    };
    if (allowedBranches?.length) {
      match['meta.branchIndex'] = { $in: allowedBranches };
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $group: { _id: '$meta.branchIndex', total_in: { $sum: '$count_in' }, total_out: { $sum: '$count_out' }, events: { $sum: 1 } } },
      { $sort: { total_in: -1 } },
    ];
    return this.countModel.aggregate(pipeline);
  }

  /** Conteos discriminados por DISPOSITIVO (radar) dentro de una empresa. */
  async byRadar(
    companyId: string,
    from: string,
    to: string,
    branchIndex?: number,
    allowedBranches?: number[],
  ) {
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('companyId inválido');
    const match: Record<string, unknown> = {
      'meta.companyId': new Types.ObjectId(companyId),
      timestamp: { $gte: new Date(from), $lte: this.endOfDay(to) },
    };
    this.applyBranchFilter(match, branchIndex, allowedBranches);

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id:       '$meta.radarId',
          total_in:  { $sum: '$count_in' },
          total_out: { $sum: '$count_out' },
          events:    { $sum: 1 },
          branchIndex: { $first: '$meta.branchIndex' },
        },
      },
      { $lookup: { from: 'radars', localField: '_id', foreignField: '_id', as: 'radar' } },
      {
        $addFields: {
          nombre:       { $ifNull: [{ $first: '$radar.nombre' }, 'Radar desconocido'] },
          uid_hardware: { $first: '$radar.uid_hardware' },
        },
      },
      { $project: { radar: 0 } },
      { $sort: { total_in: -1 } },
    ];
    return this.countModel.aggregate(pipeline);
  }

  /** Conteos discriminados por EMPRESA (vista global / super-admin). */
  async byCompany(from: string, to: string) {
    const pipeline: PipelineStage[] = [
      { $match: { timestamp: { $gte: new Date(from), $lte: this.endOfDay(to) } } },
      {
        $group: {
          _id:       '$meta.companyId',
          total_in:  { $sum: '$count_in' },
          total_out: { $sum: '$count_out' },
          events:    { $sum: 1 },
        },
      },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
      { $addFields: { nombre: { $ifNull: [{ $first: '$company.nombre' }, 'Empresa desconocida'] } } },
      { $project: { company: 0 } },
      { $sort: { total_in: -1 } },
    ];
    return this.countModel.aggregate(pipeline);
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────

  private applyBranchFilter(
    match: Record<string, unknown>,
    branchIndex?: number,
    allowedBranches?: number[],
  ) {
    if (branchIndex !== undefined) {
      match['meta.branchIndex'] = branchIndex;
    } else if (allowedBranches?.length) {
      match['meta.branchIndex'] = { $in: allowedBranches };
    }
  }

  private endOfDay(to: string): Date {
    const d = new Date(to);
    if (to.length === 10) d.setUTCHours(23, 59, 59, 999);
    return d;
  }

  private async sumPeriod(
    companyId: string,
    from: Date,
    to: Date,
    branchIndex?: number,
    radarId?: string,
    allowedBranches?: number[],
  ) {
    const match: Record<string, unknown> = {
      'meta.companyId': new Types.ObjectId(companyId),
      timestamp: { $gte: from, $lte: to },
    };
    this.applyBranchFilter(match, branchIndex, allowedBranches);
    if (radarId && Types.ObjectId.isValid(radarId)) {
      match['meta.radarId'] = new Types.ObjectId(radarId);
    }

    const [result] = await this.countModel.aggregate([
      { $match: match },
      { $group: { _id: null, total_in: { $sum: '$count_in' }, total_out: { $sum: '$count_out' } } },
    ]);
    return result ?? { total_in: 0, total_out: 0 };
  }

  private async getPeakHour(
    companyId: string,
    from: Date,
    to: Date,
    branchIndex?: number,
    radarId?: string,
    allowedBranches?: number[],
  ) {
    const match: Record<string, unknown> = {
      'meta.companyId': new Types.ObjectId(companyId),
      timestamp: { $gte: from, $lte: to },
    };
    this.applyBranchFilter(match, branchIndex, allowedBranches);
    if (radarId && Types.ObjectId.isValid(radarId)) {
      match['meta.radarId'] = new Types.ObjectId(radarId);
    }

    const [result] = await this.countModel.aggregate([
      { $match: match },
      { $group: { _id: { hour: { $hour: '$timestamp' } }, total_in: { $sum: '$count_in' } } },
      { $sort: { total_in: -1 } },
      { $limit: 1 },
    ]);
    return result ? { hour: result._id.hour, total_in: result.total_in } : null;
  }

  private buildGroupId(granularity: Granularity) {
    const base = { year: { $year: '$timestamp' }, month: { $month: '$timestamp' } };
    switch (granularity) {
      case 'hour':  return { ...base, day: { $dayOfMonth: '$timestamp' }, hour: { $hour: '$timestamp' } };
      case 'day':   return { ...base, day: { $dayOfMonth: '$timestamp' } };
      case 'week':  return { year: { $year: '$timestamp' }, week: { $week: '$timestamp' } };
      case 'month': default: return base;
    }
  }
}
