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
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { AuditService } from '../audit/audit.service';
import { Roles } from '../auth/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantIdParam } from '../common/guards';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateBranchDto,
  UpdateBranchDto,
  AddUserDto,
  UpdateUserDto,
} from '../common/dto';

import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Companies')
@ApiBearerAuth()
@TenantIdParam('id')
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly svc: CompaniesService,
    private readonly auditService: AuditService,
  ) {}

  // ── Platform / Super Admin ─────────────────────────────────────────────────

  /** Super Admin: listar todas las empresas con paginación */
  @Get()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Listar empresas', description: 'Super Admin: lista todas las empresas con paginación' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.findAll(page, limit);
  }

  /** Super Admin: KPIs globales de la plataforma */
  @Get('platform-kpis')
  @Roles('super_admin')
  @ApiOperation({ summary: 'KPIs globales de plataforma', description: 'Super Admin: total tenants, radares y conteos de hoy' })
  platformKpis() {
    return this.svc.getPlatformKpis();
  }

  /** Audit logs (Super Admin ve global o filtrado; Admin ve su empresa) */
  @Get('audit-logs')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Logs de auditoría', description: 'Historial de acciones administrativas' })
  getAuditLogs(
    @CurrentUser() user: { role: string; companyId: string },
    @Query('companyId') companyId?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    const targetCompanyId = user.role === 'super_admin' ? companyId : user.companyId;
    return this.auditService.findLogs(targetCompanyId, limit);
  }

  /** Obtener empresa por ID */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener empresa', description: 'Obtiene una empresa por ID' })
  findOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  /** Super Admin: crear nueva empresa (tenant) */
  @Post()
  @Roles('super_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear empresa', description: 'Super Admin: crea una nueva empresa (tenant)' })
  create(
    @Body() dto: CreateCompanyDto,
    @CurrentUser() user: { email: string; role: string },
  ) {
    return this.svc.create(dto, user);
  }

  /** Admin empresa o Super Admin: actualizar datos de la empresa */
  @Patch(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Actualizar empresa', description: 'Actualiza los datos de la empresa' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: { email: string; role: string },
  ) {
    return this.svc.update(id, dto, user);
  }

  /** Super Admin: eliminar empresa (soft delete) */
  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Eliminar empresa', description: 'Super Admin: soft delete de la empresa' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { email: string; role: string },
  ) {
    return this.svc.softDelete(id, user);
  }

  // ── Branches ───────────────────────────────────────────────────────────────

  /** Listar sedes de una empresa */
  @Get(':id/branches')
  @ApiOperation({ summary: 'Listar sedes', description: 'Lista las sedes de una empresa' })
  getBranches(@Param('id') id: string) {
    return this.svc.getBranches(id);
  }

  /** Añadir sede a empresa */
  @Post(':id/branches')
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear sede', description: 'Añade una sede a la empresa' })
  addBranch(
    @Param('id') id: string,
    @Body() dto: CreateBranchDto,
    @CurrentUser() user: { email: string; role: string },
  ) {
    return this.svc.addBranch(id, dto, user);
  }

  /** Actualizar sede por índice */
  @Patch(':id/branches/:branchIndex')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Actualizar sede', description: 'Actualiza una sede por su índice' })
  updateBranch(
    @Param('id') id: string,
    @Param('branchIndex', ParseIntPipe) branchIndex: number,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: { email: string; role: string },
  ) {
    return this.svc.updateBranch(id, branchIndex, dto, user);
  }

  /** Desactivar sede (soft delete) */
  @Delete(':id/branches/:branchIndex')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Desactivar sede', description: 'Desactiva una sede (soft delete)' })
  removeBranch(
    @Param('id') id: string,
    @Param('branchIndex', ParseIntPipe) branchIndex: number,
    @CurrentUser() user: { email: string; role: string },
  ) {
    return this.svc.removeBranch(id, branchIndex, user);
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  /** Invitar usuario a la empresa */
  @Post(':id/users')
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invitar usuario', description: 'Agrega un usuario a la empresa' })
  addUser(
    @Param('id') id: string,
    @Body() dto: AddUserDto,
    @CurrentUser() user: { email: string; role: string },
  ) {
    return this.svc.addUser(id, dto, user);
  }

  /** Actualizar rol o accesos de un usuario */
  @Patch(':id/users/:email')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Actualizar usuario', description: 'Actualiza rol o sedes asignadas de un usuario' })
  updateUser(
    @Param('id') id: string,
    @Param('email') email: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { email: string; role: string },
  ) {
    return this.svc.updateUser(id, email, dto, user);
  }

  /** Desactivar usuario */
  @Delete(':id/users/:email')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Desactivar usuario', description: 'Desactiva un usuario de la empresa' })
  removeUser(
    @Param('id') id: string,
    @Param('email') email: string,
    @CurrentUser() user: { email: string; role: string },
  ) {
    return this.svc.removeUser(id, email, user);
  }
}
