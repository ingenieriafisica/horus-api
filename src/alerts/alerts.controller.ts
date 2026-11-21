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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto } from '../common/dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/roles.guard';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly svc: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar eventos de alerta' })
  findEvents(
    @CurrentUser() user: { companyId: string; role: string; branchIndexes: number[] },
    @Query('companyId') companyId?: string,
    @Query('acknowledged') acknowledged?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    const targetCompanyId =
      user.role === 'super_admin' && companyId ? companyId : user.companyId;
    const ackFilter =
      acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined;
    const allowedBranches =
      user.role === 'admin' || user.role === 'super_admin' ? undefined : user.branchIndexes;

    return this.svc.findEvents(targetCompanyId, ackFilter, limit, allowedBranches);
  }

  @Patch(':id/acknowledge')
  @Roles('admin', 'manager', 'super_admin')
  @ApiOperation({ summary: 'Marcar alerta como atendida' })
  acknowledge(
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; email: string; role: string },
  ) {
    return this.svc.acknowledgeEvent(id, user.companyId, user);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Listar reglas de alerta' })
  findRules(
    @CurrentUser() user: { companyId: string; role: string },
    @Query('companyId') companyId?: string,
  ) {
    const targetCompanyId =
      user.role === 'super_admin' && companyId ? companyId : user.companyId;
    return this.svc.findRules(targetCompanyId);
  }

  @Post('rules')
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear regla de alerta' })
  createRule(
    @Body() dto: CreateAlertRuleDto,
    @CurrentUser() user: { companyId: string; email: string; role: string },
  ) {
    const payload: CreateAlertRuleDto = {
      ...dto,
      companyId: user.role === 'super_admin' ? dto.companyId : user.companyId,
    };
    return this.svc.createRule(payload, user);
  }

  @Patch('rules/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Actualizar regla de alerta' })
  updateRule(
    @Param('id') id: string,
    @Body() dto: UpdateAlertRuleDto,
    @CurrentUser() user: { companyId: string; role: string },
  ) {
    return this.svc.updateRule(id, user.companyId, dto, user.role);
  }

  @Delete('rules/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Eliminar regla de alerta' })
  deleteRule(
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; role: string },
  ) {
    return this.svc.deleteRule(id, user.companyId, user.role);
  }
}
