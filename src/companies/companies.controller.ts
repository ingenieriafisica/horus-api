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
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateBranchDto,
  UpdateBranchDto,
  AddUserDto,
  UpdateUserDto,
} from '../common/dto';

import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

// Decorador de ejemplo (implementación real en guards/jwt-auth.guard.ts)
// @UseGuards(JwtAuthGuard, RolesGuard)

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly svc: CompaniesService) {}

  // ── Companies ──────────────────────────────────────────────────────────────

  /** Super Admin: listar todas las empresas con paginación */
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.findAll(page, limit);
  }

  /** Obtener empresa por ID */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  /** Super Admin: crear nueva empresa (tenant) */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCompanyDto) {
    return this.svc.create(dto);
  }

  /** Admin empresa o Super Admin: actualizar datos de la empresa */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.svc.update(id, dto);
  }

  /** Super Admin: eliminar empresa (soft delete) */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.softDelete(id);
  }

  // ── Branches ───────────────────────────────────────────────────────────────

  /** Listar sedes de una empresa */
  @Get(':id/branches')
  getBranches(@Param('id') id: string) {
    return this.svc.getBranches(id);
  }

  /** Añadir sede a empresa */
  @Post(':id/branches')
  @HttpCode(HttpStatus.CREATED)
  addBranch(@Param('id') id: string, @Body() dto: CreateBranchDto) {
    return this.svc.addBranch(id, dto);
  }

  /** Actualizar sede por índice */
  @Patch(':id/branches/:branchIndex')
  updateBranch(
    @Param('id') id: string,
    @Param('branchIndex', ParseIntPipe) branchIndex: number,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.svc.updateBranch(id, branchIndex, dto);
  }

  /** Desactivar sede (soft delete) */
  @Delete(':id/branches/:branchIndex')
  removeBranch(
    @Param('id') id: string,
    @Param('branchIndex', ParseIntPipe) branchIndex: number,
  ) {
    return this.svc.removeBranch(id, branchIndex);
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  /** Invitar usuario a la empresa */
  @Post(':id/users')
  @HttpCode(HttpStatus.CREATED)
  addUser(@Param('id') id: string, @Body() dto: AddUserDto) {
    return this.svc.addUser(id, dto);
  }

  /** Actualizar rol o accesos de un usuario */
  @Patch(':id/users/:email')
  updateUser(
    @Param('id') id: string,
    @Param('email') email: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.svc.updateUser(id, email, dto);
  }

  /** Desactivar usuario */
  @Delete(':id/users/:email')
  removeUser(@Param('id') id: string, @Param('email') email: string) {
    return this.svc.removeUser(id, email);
  }
}
