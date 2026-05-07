import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { Count, CountDocument } from '../companies/entities/company.schema';
import { CamerasService } from '../cameras/cameras.service';
import { IngestCountDto, CountQueryDto } from '../common/dto';

type Granularity = 'hour' | 'day' | 'week' | 'month';

@Injectable()
export class CountsService {
  constructor(
    @InjectModel(Count.name)
    private readonly countModel: Model<CountDocument>,
    private readonly camerasService: CamerasService,
  ) {}

  // ─── Ingestión (llamado por el ESP32) ─────────────────────────────────────

  /**
   * Recibe un evento de conteo desde un ESP32.
   * Valida el uid_hardware, deduplica por ventana de 5s y persiste.
   */
  async ingest(dto: IngestCountDto): Promise<{ ok: boolean }> {
    // 1. Validar el dispositivo
    const camera = await this.camerasService.validateDevice(dto.uid_hardware);

    // 2. Parsear y validar timestamp
    const ts = new Date(dto.timestamp_utc);
    if (isNaN(ts.getTime())) {
      throw new BadRequestException('timestamp_utc inválido');
    }

    // 3. Deduplicación: ventana de 5 segundos por cámara
    const windowStart = new Date(ts.getTime() - 5000);
    const windowEnd = new Date(ts.getTime() + 5000);
    const duplicate = await this.countModel.findOne({
      'meta.cameraId': camera._id,
      timestamp: { $gte: windowStart, $lte: windowEnd },
    });
    if (duplicate) {
      return { ok: true }; // idempotente: devolver OK sin duplicar
    }

    // 4. Persistir
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

  // ─── Consultas de analytics ────────────────────────────────────────────────

  /**
   * Query principal del dashboard.
   * Devuelve series temporales agrupadas por granularidad.
   */
  async query(dto: CountQueryDto) {
    const { from, to, granularity = 'day', companyId } = dto;

    const start = new Date(from);
    const end = new Date(to);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    const matchStage: Record<string, unknown> = {
      'meta.companyId': new Types.ObjectId(companyId),
      timestamp: { $gte: start, $lte: end },
    };

    if (dto.branchIndex !== undefined) {
      matchStage['meta.branchIndex'] = dto.branchIndex;
    }

    if (dto.cameraId) {
      matchStage['meta.cameraId'] = new Types.ObjectId(dto.cameraId);
    }

    const groupId = this.buildGroupId(granularity);

    const pipeline: PipelineStage[] = [
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

    // Calcular totales del período
    const totals = series.reduce(
      (acc, row) => {
        acc.total_in += row.total_in;
        acc.total_out += row.total_out;
        return acc;
      },
      { total_in: 0, total_out: 0 },
    );

    return { series, totals, from, to, granularity };
  }

  /** Resumen rápido para las tarjetas KPI del dashboard */
  async getKpis(companyId: string, branchIndex?: number) {
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

  /** Comparativa entre períodos (período actual vs. período anterior) */
  async compare(
    companyId: string,
    from: string,
    to: string,
    branchIndex?: number,
  ) {
    const start = new Date(from);
    const end = new Date(to);
    const diffMs = end.getTime() - start.getTime();

    const prevStart = new Date(start.getTime() - diffMs);
    const prevEnd = new Date(start);

    const [current, previous] = await Promise.all([
      this.sumPeriod(companyId, start, end, branchIndex),
      this.sumPeriod(companyId, prevStart, prevEnd, branchIndex),
    ]);

    const pct = (curr: number, prev: number) =>
      prev === 0 ? null : +((((curr - prev) / prev) * 100).toFixed(2));

    return {
      current,
      previous,
      change_pct: {
        in: pct(current.total_in, previous.total_in),
        out: pct(current.total_out, previous.total_out),
      },
    };
  }

  /** Comparativa entre todas las sedes de una empresa */
  async compareByBranch(companyId: string, from: string, to: string) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          'meta.companyId': new Types.ObjectId(companyId),
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

  // ─── Helpers privados ──────────────────────────────────────────────────────

  private async sumPeriod(
    companyId: string,
    from: Date,
    to: Date,
    branchIndex?: number,
  ) {
    const match: Record<string, unknown> = {
      'meta.companyId': new Types.ObjectId(companyId),
      timestamp: { $gte: from, $lte: to },
    };
    if (branchIndex !== undefined) match['meta.branchIndex'] = branchIndex;

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

  private async getPeakHour(
    companyId: string,
    from: Date,
    to: Date,
    branchIndex?: number,
  ) {
    const match: Record<string, unknown> = {
      'meta.companyId': new Types.ObjectId(companyId),
      timestamp: { $gte: from, $lte: to },
    };
    if (branchIndex !== undefined) match['meta.branchIndex'] = branchIndex;

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

  private buildGroupId(granularity: Granularity) {
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
}
