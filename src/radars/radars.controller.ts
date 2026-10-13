import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RadarsService } from './radars.service';
import { CreateRadarDto, UpdateRadarDto, HeartbeatDto } from '../common/dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Radars')
@ApiBearerAuth()
@Controller('radars')
export class RadarsController {
  constructor(private readonly svc: RadarsService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRadarDto) {
    return this.svc.create(dto);
  }

  @Get()
  findByCompany(@Query('companyId') companyId: string) {
    return this.svc.findByCompany(companyId);
  }

  @Get('branch')
  findByBranch(
    @Query('companyId') companyId: string,
    @Query('branchIndex') branchIndex: string,
  ) {
    return this.svc.findByBranch(companyId, parseInt(branchIndex, 10));
  }

  @Get('status-summary')
  statusSummary(@Query('companyId') companyId: string) {
    return this.svc.getStatusSummary(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRadarDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  deactivate(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.svc.deactivate(id, companyId);
  }

  // ─── ESP32 → API (heartbeat, público — autenticado por uid_hardware) ──────

  @Public()
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  heartbeat(@Body() dto: HeartbeatDto) {
    return this.svc.heartbeat(dto);
  }

  // ─── API → ESP32 (proxy a la API local del radar, protegido por JWT) ──────

  /** Datos en tiempo real desde el radar (presencia + conteos actuales) */
  @Get(':id/realtime')
  probeRealtime(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.svc.probeRealtime(id, companyId);
  }

  /** Estadísticas del radar (RSSI, heap libre, uptime, etc.) */
  @Get(':id/stats')
  probeStats(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.svc.probeStats(id, companyId);
  }

  /** Estado de salud del radar */
  @Get(':id/health')
  probeHealth(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.svc.probeHealth(id, companyId);
  }
}
