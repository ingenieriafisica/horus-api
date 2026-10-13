import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CountsService } from './counts.service';
import { IngestCountDto, CountQueryDto } from '../common/dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Counts')
@ApiBearerAuth()
@Controller('counts')
export class CountsController {
  constructor(private readonly svc: CountsService) {}

  /**
   * POST /counts/ingest — público, autenticado solo por uid_hardware (ESP32)
   */
  @Public()
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
   *   branchIndex?, radarId?
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

  /**
   * GET /counts/by-radar
   * Conteos discriminados por DISPOSITIVO (radar) en un rango de fechas.
   * Opcional: branchIndex para acotar a una sede. Devuelve nombre/uid del radar.
   */
  @Get('by-radar')
  byRadar(
    @Query('companyId') companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchIndex') branchIndex?: string,
  ) {
    const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
    return this.svc.byRadar(companyId, from, to, idx);
  }

  /**
   * GET /counts/by-company
   * Conteos discriminados por EMPRESA (vista global). Cruza tenants, por lo que
   * queda restringido a super_admin.
   */
  @Get('by-company')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  byCompany(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.svc.byCompany(from, to);
  }
}
