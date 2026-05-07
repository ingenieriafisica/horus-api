import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, ParseIntPipe, Optional } from '@nestjs/common';
import { CountsService } from './counts.service';
import { IngestCountDto, CountQueryDto } from '../common/dto';

@Controller('counts')
export class CountsController {
  constructor(private readonly svc: CountsService) {}

  /**
   * POST /counts/ingest
   * Endpoint público (protegido por uid_hardware) que llama el ESP32
   * para reportar cada evento de conteo de personas.
   *
   * El ESP32 debe enviar:
   * {
   *   "uid_hardware": "ABC123",
   *   "timestamp_utc": "2025-05-07T14:30:00Z",
   *   "count_in": 3,
   *   "count_out": 1
   * }
   */
  @Post('ingest')
  @HttpCode(HttpStatus.OK)
  ingest(@Body() dto: IngestCountDto) {
    return this.svc.ingest(dto);
  }

  /**
   * GET /counts/query
   * Query principal del dashboard. Devuelve series temporales.
   *
   * Params:
   *   companyId, from, to, granularity (hour|day|week|month),
   *   branchIndex?, cameraId?
   */
  @Get('query')
  query(@Query() dto: CountQueryDto) {
    return this.svc.query(dto);
  }

  /**
   * GET /counts/kpis
   * Métricas rápidas para las tarjetas del dashboard:
   * - visitantes hoy
   * - visitantes este mes
   * - visitantes este año
   * - hora pico de hoy
   */
  @Get('kpis')
  kpis(
    @Query('companyId') companyId: string,
    @Query('branchIndex') branchIndex?: string,
  ) {
    const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
    return this.svc.getKpis(companyId, idx);
  }

  /**
   * GET /counts/compare
   * Comparativa período actual vs. período anterior.
   * Devuelve valores absolutos y variación porcentual.
   */
  @Get('compare')
  compare(
    @Query('companyId') companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchIndex') branchIndex?: string,
  ) {
    const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
    return this.svc.compare(companyId, from, to, idx);
  }

  /**
   * GET /counts/by-branch
   * Comparativa entre todas las sedes de la empresa en un rango de fechas.
   * Útil para el ranking de sedes en el dashboard del Admin.
   */
  @Get('by-branch')
  compareByBranch(
    @Query('companyId') companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.svc.compareByBranch(companyId, from, to);
  }
}
