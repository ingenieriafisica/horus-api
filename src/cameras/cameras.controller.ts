import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CamerasService } from './cameras.service';
import { CreateCameraDto, UpdateCameraDto, HeartbeatDto } from '../common/dto';

@Controller('cameras')
export class CamerasController {
  constructor(private readonly svc: CamerasService) {}

  /** Registrar una nueva cámara / ESP32 */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCameraDto) {
    return this.svc.create(dto);
  }

  /** Listar cámaras de una empresa */
  @Get()
  findByCompany(@Query('companyId') companyId: string) {
    return this.svc.findByCompany(companyId);
  }

  /** Listar cámaras de una sede específica */
  @Get('branch')
  findByBranch(
    @Query('companyId') companyId: string,
    @Query('branchIndex', ParseIntPipe) branchIndex: number,
  ) {
    return this.svc.findByBranch(companyId, branchIndex);
  }

  /** Resumen de estado de cámaras (activas / inactivas / error) */
  @Get('status-summary')
  statusSummary(@Query('companyId') companyId: string) {
    return this.svc.getStatusSummary(companyId);
  }

  /** Obtener una cámara por ID */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  /** Actualizar datos de una cámara */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCameraDto) {
    return this.svc.update(id, dto);
  }

  /** Desactivar una cámara */
  @Delete(':id')
  deactivate(@Param('id') id: string, @Query('companyId') companyId: string) {
    return this.svc.deactivate(id, companyId);
  }

  /**
   * Heartbeat enviado por el ESP32 periódicamente.
   * No requiere JWT — usa uid_hardware para identificarse.
   * Actualiza last_seen, ip y firmware.
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  heartbeat(@Body() dto: HeartbeatDto) {
    return this.svc.heartbeat(dto);
  }
}
