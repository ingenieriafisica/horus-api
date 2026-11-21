import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CountsService } from './counts.service';
import { IngestCountDto, CountQueryDto } from '../common/dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/roles.guard';
import { assertBranchAccess } from '../common/guards';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

interface JwtUser {
  email: string;
  companyId: string;
  role: string;
  branchIndexes: number[];
}

@ApiTags('Counts')
@ApiBearerAuth()
@Controller('counts')
export class CountsController {
  constructor(private readonly svc: CountsService) {}

  /**
   * POST /counts/ingest — público, autenticado por uid_hardware y Bearer device_key opcional
   */
  @Public()
  @Post('ingest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ingestar conteos', description: 'Público, autenticado por uid_hardware y Bearer opcional del ESP32' })
  ingest(
    @Body() dto: IngestCountDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    return this.svc.ingest(dto, bearer);
  }

  /**
   * GET /counts/query
   * Query principal del dashboard. Devuelve series temporales.
   */
  @Get('query')
  @ApiOperation({ summary: 'Consultar series temporales', description: 'Devuelve conteos agrupados por hora, día, semana o mes' })
  query(
    @Query() dto: CountQueryDto,
    @CurrentUser() user: JwtUser,
  ) {
    assertBranchAccess(user, dto.branchIndex);
    const allowed = this.allowedBranches(user);
    return this.svc.query(dto, allowed);
  }

  /**
   * GET /counts/export
   * Exporta series temporales en formato CSV.
   */
  @Get('export')
  @ApiOperation({ summary: 'Exportar conteos en CSV' })
  async exportCsv(
    @Query() dto: CountQueryDto,
    @CurrentUser() user: JwtUser,
    @Res() res: Response,
  ) {
    assertBranchAccess(user, dto.branchIndex);
    const allowed = this.allowedBranches(user);
    const csv = await this.svc.exportCsv(dto, allowed);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="horus-counts.csv"');
    res.send(csv);
  }

  /**
   * GET /counts/kpis
   */
  @Get('kpis')
  @ApiOperation({ summary: 'Obtener KPIs', description: 'Visitantes hoy, mes, año y hora pico' })
  kpis(
    @Query('companyId') companyId: string,
    @CurrentUser() user: JwtUser,
    @Query('branchIndex') branchIndex?: string,
    @Query('radarId') radarId?: string,
  ) {
    const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
    assertBranchAccess(user, idx);
    return this.svc.getKpis(companyId, idx, radarId, this.allowedBranches(user));
  }

  /**
   * GET /counts/compare
   */
  @Get('compare')
  @ApiOperation({ summary: 'Comparar períodos', description: 'Comparativa período actual vs anterior' })
  compare(
    @Query('companyId') companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: JwtUser,
    @Query('branchIndex') branchIndex?: string,
    @Query('radarId') radarId?: string,
  ) {
    const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
    assertBranchAccess(user, idx);
    return this.svc.compare(companyId, from, to, idx, radarId, this.allowedBranches(user));
  }

  /**
   * GET /counts/by-branch
   */
  @Get('by-branch')
  @ApiOperation({ summary: 'Conteos por sede', description: 'Comparativa y ranking de sedes' })
  compareByBranch(
    @Query('companyId') companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.svc.compareByBranch(companyId, from, to, this.allowedBranches(user));
  }

  /**
   * GET /counts/by-radar
   */
  @Get('by-radar')
  @ApiOperation({ summary: 'Conteos por radar', description: 'Conteos discriminados por dispositivo' })
  byRadar(
    @Query('companyId') companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: JwtUser,
    @Query('branchIndex') branchIndex?: string,
  ) {
    const idx = branchIndex !== undefined ? parseInt(branchIndex, 10) : undefined;
    assertBranchAccess(user, idx);
    return this.svc.byRadar(companyId, from, to, idx, this.allowedBranches(user));
  }

  /**
   * GET /counts/by-company
   */
  @Get('by-company')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Conteos por empresa (Global)', description: 'Restringido a super_admin' })
  byCompany(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.svc.byCompany(from, to);
  }

  private allowedBranches(user: JwtUser): number[] | undefined {
    if (user.role === 'admin' || user.role === 'super_admin') return undefined;
    return user.branchIndexes?.length ? user.branchIndexes : undefined;
  }
}
