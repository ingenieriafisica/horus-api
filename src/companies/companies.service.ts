import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument, PLAN_LIMITS } from './entities/company.schema';
import { Radar, RadarDocument } from '../radars/entities/radar.schema';
import { Count, CountDocument } from '../counts/entities/count.schema';
import { AuditService } from '../audit/audit.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateBranchDto,
  UpdateBranchDto,
  AddUserDto,
  UpdateUserDto,
} from '../common/dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(Radar.name)
    private readonly radarModel: Model<RadarDocument>,
    @InjectModel(Count.name)
    private readonly countModel: Model<CountDocument>,
    private readonly auditService: AuditService,
  ) {}

  // ─── Companies ─────────────────────────────────────────────────────────────

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.companyModel
        .find({ status: { $ne: 'deleted' } })
        .select('-users -sedes.radars')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.companyModel.countDocuments({ status: { $ne: 'deleted' } }),
    ]);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getPlatformKpis() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalTenants,
      activeTenants,
      planBreakdown,
      radarBreakdown,
      todayCounts,
    ] = await Promise.all([
      this.companyModel.countDocuments({ status: { $ne: 'deleted' } }),
      this.companyModel.countDocuments({ status: 'active' }),
      this.companyModel.aggregate([
        { $match: { status: { $ne: 'deleted' } } },
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
      this.radarModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.countModel.aggregate([
        { $match: { timestamp: { $gte: startOfDay } } },
        {
          $group: {
            _id: null,
            total_in: { $sum: '$count_in' },
            total_out: { $sum: '$count_out' },
            events: { $sum: 1 },
          },
        },
      ]),
    ]);

    const plans: Record<string, number> = { starter: 0, pro: 0, enterprise: 0 };
    planBreakdown.forEach((p) => (plans[p._id] = p.count));

    const radars: Record<string, number> = { active: 0, inactive: 0, error: 0, offline: 0 };
    radarBreakdown.forEach((r) => (radars[r._id] = r.count));

    return {
      tenants: { total: totalTenants, active: activeTenants, plans },
      radars: {
        total: Object.values(radars).reduce((a, b) => a + b, 0),
        ...radars,
      },
      today: todayCounts[0] ?? { total_in: 0, total_out: 0, events: 0 },
      generatedAt: new Date(),
    };
  }

  async findById(id: string): Promise<CompanyDocument> {
    this.assertObjectId(id);
    const company = await this.companyModel.findById(id).exec();
    if (!company || company.status === 'deleted') {
      throw new NotFoundException(`Empresa ${id} no encontrada`);
    }
    return company;
  }

  async findByNit(nit: string): Promise<CompanyDocument> {
    const company = await this.companyModel.findOne({ nit, status: { $ne: 'deleted' } }).exec();
    if (!company) throw new NotFoundException(`Empresa con NIT ${nit} no encontrada`);
    return company;
  }

  async create(
    dto: CreateCompanyDto,
    actor?: { email?: string; role?: string },
  ): Promise<CompanyDocument> {
    const exists = await this.companyModel
      .findOne({ $or: [{ nit: dto.nit }, { dbName: dto.dbName }] })
      .lean();
    if (exists) {
      throw new ConflictException('NIT o dbName ya registrado');
    }
    const company = await new this.companyModel(dto).save();
    await this.auditService.log({
      companyId: (company._id as Types.ObjectId).toString(),
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'CREATE_COMPANY',
      resource: 'company',
      resourceId: (company._id as Types.ObjectId).toString(),
      details: { nombre: dto.nombre, plan: company.plan },
    });
    return company;
  }

  async update(
    id: string,
    dto: UpdateCompanyDto,
    actor?: { email?: string; role?: string },
  ): Promise<CompanyDocument> {
    const company = await this.findById(id);
    // Solo super_admin puede cambiar plan o status de suscripción
    if (actor?.role !== 'super_admin' && (dto.plan !== undefined || dto.status !== undefined)) {
      throw new ForbiddenException('Solo Super Admin puede modificar el plan o estado de la empresa');
    }
    Object.assign(company, dto);
    const saved = await company.save();
    await this.auditService.log({
      companyId: id,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'UPDATE_COMPANY',
      resource: 'company',
      resourceId: id,
      details: { ...dto },
    });
    return saved;
  }

  async softDelete(
    id: string,
    actor?: { email?: string; role?: string },
  ): Promise<{ message: string }> {
    await this.findById(id);
    await this.companyModel.findByIdAndUpdate(id, { status: 'deleted' });
    await this.auditService.log({
      companyId: id,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'DELETE_COMPANY',
      resource: 'company',
      resourceId: id,
    });
    return { message: `Empresa ${id} eliminada` };
  }

  // ─── Branches ──────────────────────────────────────────────────────────────

  async addBranch(
    companyId: string,
    dto: CreateBranchDto,
    actor?: { email?: string; role?: string },
  ): Promise<CompanyDocument> {
    const company = await this.findById(companyId);
    const limits = PLAN_LIMITS[company.plan] ?? PLAN_LIMITS.starter;
    const activeBranches = company.sedes.filter((s) => s.active).length;
    if (activeBranches >= limits.maxBranches) {
      throw new ForbiddenException(
        `Tu plan ${limits.label} permite máximo ${limits.maxBranches} sedes activas. Actualiza tu plan para agregar más.`,
      );
    }

    company.sedes.push({ ...dto, active: true, radars: [] });
    const saved = await company.save();
    await this.auditService.log({
      companyId,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'ADD_BRANCH',
      resource: 'branch',
      resourceId: String(saved.sedes.length - 1),
      details: { nombre: dto.nombre, ciudad: dto.ciudad },
    });
    return saved;
  }

  async updateBranch(
    companyId: string,
    branchIndex: number,
    dto: UpdateBranchDto,
    actor?: { email?: string; role?: string },
  ): Promise<CompanyDocument> {
    const company = await this.findById(companyId);
    const branch = company.sedes[branchIndex];
    if (!branch) throw new NotFoundException(`Sede ${branchIndex} no existe`);
    Object.assign(branch, dto);
    company.markModified('sedes');
    const saved = await company.save();
    await this.auditService.log({
      companyId,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'UPDATE_BRANCH',
      resource: 'branch',
      resourceId: String(branchIndex),
      details: { ...dto },
    });
    return saved;
  }

  async removeBranch(
    companyId: string,
    branchIndex: number,
    actor?: { email?: string; role?: string },
  ): Promise<CompanyDocument> {
    const company = await this.findById(companyId);
    if (!company.sedes[branchIndex]) {
      throw new NotFoundException(`Sede ${branchIndex} no existe`);
    }
    // Soft delete: marcar como inactiva en lugar de borrar para preservar histórico
    company.sedes[branchIndex].active = false;
    company.markModified('sedes');
    const saved = await company.save();
    await this.auditService.log({
      companyId,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'REMOVE_BRANCH',
      resource: 'branch',
      resourceId: String(branchIndex),
    });
    return saved;
  }

  async getBranches(companyId: string) {
    const company = await this.findById(companyId);
    return company.sedes.map((s: any, i) => ({
      ...(typeof s.toObject === 'function' ? s.toObject() : s),
      branchIndex: i,
    }));
  }

  /** Añade la referencia de un radar a la sede */
  async linkRadar(
    companyId: string,
    branchIndex: number,
    radarId: Types.ObjectId,
  ): Promise<void> {
    const company = await this.findById(companyId);
    if (!company.sedes[branchIndex]) {
      throw new NotFoundException(`Sede ${branchIndex} no existe`);
    }
    const alreadyLinked = company.sedes[branchIndex].radars.some(
      (r) => r.toString() === radarId.toString(),
    );
    if (!alreadyLinked) {
      company.sedes[branchIndex].radars.push(radarId);
      company.markModified('sedes');
      await company.save();
    }
  }

  /** Remueve la referencia de un radar de la sede */
  async unlinkRadar(
    companyId: string,
    branchIndex: number,
    radarId: Types.ObjectId,
  ): Promise<void> {
    const company = await this.findById(companyId);
    if (!company.sedes[branchIndex]) return;
    company.sedes[branchIndex].radars = company.sedes[branchIndex].radars.filter(
      (r) => r.toString() !== radarId.toString(),
    );
    company.markModified('sedes');
    await company.save();
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  async addUser(
    companyId: string,
    dto: AddUserDto,
    actor?: { email?: string; role?: string },
  ): Promise<CompanyDocument> {
    if (dto.role === 'super_admin' && actor?.role !== 'super_admin') {
      throw new ForbiddenException('Solo un Super Admin puede asignar el rol super_admin');
    }
    const company = await this.findById(companyId);
    const normalizedEmail = dto.email.toLowerCase().trim();
    const already = company.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (already) {
      if (!already.active) {
        already.active = true;
        already.role = dto.role;
        already.branchIndexes = dto.branchIndexes ?? [];
        company.markModified('users');
        return company.save();
      }
      throw new ConflictException(`${normalizedEmail} ya está registrado en esta empresa`);
    }
    company.users.push({
      email: normalizedEmail,
      role: dto.role,
      active: true,
      branchIndexes: dto.branchIndexes ?? [],
    });
    const saved = await company.save();
    await this.auditService.log({
      companyId,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'ADD_USER',
      resource: 'user',
      resourceId: normalizedEmail,
      details: { role: dto.role, branchIndexes: dto.branchIndexes ?? [] },
    });
    return saved;
  }

  async updateUser(
    companyId: string,
    email: string,
    dto: UpdateUserDto,
    actor?: { email?: string; role?: string },
  ): Promise<CompanyDocument> {
    if (dto.role === 'super_admin' && actor?.role !== 'super_admin') {
      throw new ForbiddenException('Solo un Super Admin puede asignar el rol super_admin');
    }
    const company = await this.findById(companyId);
    const user = company.users.find((u) => u.email === email);
    if (!user) throw new NotFoundException(`Usuario ${email} no encontrado`);
    Object.assign(user, dto);
    company.markModified('users');
    return company.save();
  }

  async removeUser(
    companyId: string,
    email: string,
    actor?: { email?: string; role?: string },
  ): Promise<CompanyDocument> {
    const company = await this.findById(companyId);
    const idx = company.users.findIndex((u) => u.email === email);
    if (idx === -1) throw new NotFoundException(`Usuario ${email} no encontrado`);
    company.users[idx].active = false;
    company.markModified('users');
    const saved = await company.save();
    await this.auditService.log({
      companyId,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'REMOVE_USER',
      resource: 'user',
      resourceId: email,
    });
    return saved;
  }

  async findUserInCompany(companyId: string, email: string) {
    const company = await this.findById(companyId);
    return company.users.find((u) => u.email === email && u.active);
  }

  /** Busca en qué empresa está registrado un email (para el flujo de OTP) */
  async findCompanyByUserEmail(email: string) {
    return this.companyModel
      .findOne({ 'users.email': email, 'users.active': true, status: 'active' })
      .lean();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private assertObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`ID inválido: ${id}`);
    }
  }
}
