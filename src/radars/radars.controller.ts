import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RadarsService } from './radars.service';
import { CreateRadarDto, UpdateRadarDto, HeartbeatDto } from '../common/dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/roles.guard';
import { assertBranchAccess } from '../common/guards';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Radars')
@ApiBearerAuth()
@Controller('radars')
export class RadarsController {
  constructor(private readonly svc: RadarsService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Post()
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar radar', description: 'Registra un nuevo radar ESP32 y devuelve su device_key' })
  create(
    @Body() dto: CreateRadarDto,
    @CurrentUser() user: { email: string; role: string },
  ) {
    return this.svc.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar radares por empresa' })
  findByCompany(
    @Query('companyId') companyId: string | undefined,
    @CurrentUser() user: { companyId: string; role: string; branchIndexes: number[] },
  ) {
    const targetCompanyId =
      user.role === 'super_admin' && companyId ? companyId : user.companyId;
    return this.svc.findByCompany(targetCompanyId, user);
  }

  @Get('branch')
  @ApiOperation({ summary: 'Listar radares por sede' })
  findByBranch(
    @Query('companyId') companyId: string | undefined,
    @Query('branchIndex') branchIndex: string,
    @CurrentUser() user: { companyId: string; role: string; branchIndexes: number[] },
  ) {
    const idx = parseInt(branchIndex, 10);
    assertBranchAccess(user, idx);
    const targetCompanyId =
      user.role === 'super_admin' && companyId ? companyId : user.companyId;
    return this.svc.findByBranch(targetCompanyId, idx);
  }

  @Get('status-summary')
  @ApiOperation({ summary: 'Resumen de estado de radares' })
  statusSummary(
    @Query('companyId') companyId: string | undefined,
    @CurrentUser() user: { companyId: string; role: string },
  ) {
    const targetCompanyId =
      user.role === 'super_admin' && companyId ? companyId : user.companyId;
    return this.svc.getStatusSummary(targetCompanyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener radar por ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; role: string },
  ) {
    return this.svc.findById(id, user.companyId, user.role);
  }

  @Patch(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Actualizar radar' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRadarDto,
    @CurrentUser() user: { companyId: string; role: string },
  ) {
    return this.svc.update(id, dto, user.companyId, user.role);
  }

  @Post(':id/rotate-key')
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotar API key del radar' })
  rotateKey(
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; email: string; role: string },
  ) {
    return this.svc.rotateKey(id, user.companyId, user);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Desactivar radar' })
  deactivate(
    @Param('id') id: string,
    @Query('companyId') companyId: string | undefined,
    @CurrentUser() user: { companyId: string; email: string; role: string },
  ) {
    const targetCompanyId =
      user.role === 'super_admin' && companyId ? companyId : user.companyId;
    return this.svc.deactivate(id, targetCompanyId, user);
  }

  // ─── ESP32 → API (heartbeat, público — autenticado por uid_hardware / Bearer) ──

  @Public()
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Heartbeat ESP32', description: 'Endpoint público autenticado por uid_hardware y Bearer opcional' })
  heartbeat(
    @Body() dto: HeartbeatDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    return this.svc.heartbeat(dto, bearer);
  }

  // ─── API → ESP32 (proxy a la API local del radar, protegido por JWT) ──────

  /** Datos en tiempo real desde el radar (presencia + conteos actuales) */
  @Get(':id/realtime')
  @ApiOperation({ summary: 'Telemetría en tiempo real', description: 'Proxy a la API local del radar' })
  probeRealtime(
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; role: string },
  ) {
    return this.svc.probeRealtime(id, user.companyId, user.role);
  }

  /** Estadísticas del radar (RSSI, heap libre, uptime, etc.) */
  @Get(':id/stats')
  @ApiOperation({ summary: 'Estadísticas del radar', description: 'RSSI, heap libre, uptime' })
  probeStats(
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; role: string },
  ) {
    return this.svc.probeStats(id, user.companyId, user.role);
  }

  /** Estado de salud del radar */
  @Get(':id/health')
  @ApiOperation({ summary: 'Salud del radar' })
  probeHealth(
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; role: string },
  ) {
    return this.svc.probeHealth(id, user.companyId, user.role);
  }
}
