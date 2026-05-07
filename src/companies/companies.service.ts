import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from './entities/company.schema';
import { CreateCompanyDto, UpdateCompanyDto, CreateBranchDto, UpdateBranchDto, AddUserDto, UpdateUserDto } from '../common/dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
  ) {}

  // ─── Companies ─────────────────────────────────────────────────────────────

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.companyModel
        .find({ status: { $ne: 'deleted' } })
        .select('-users -sedes.cameras')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.companyModel.countDocuments({ status: { $ne: 'deleted' } }),
    ]);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
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

  async create(dto: CreateCompanyDto): Promise<CompanyDocument> {
    const exists = await this.companyModel
      .findOne({ $or: [{ nit: dto.nit }, { dbName: dto.dbName }] })
      .lean();
    if (exists) {
      throw new ConflictException('NIT o dbName ya registrado');
    }
    const company = new this.companyModel(dto);
    return company.save();
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<CompanyDocument> {
    const company = await this.findById(id);
    Object.assign(company, dto);
    return company.save();
  }

  async softDelete(id: string): Promise<{ message: string }> {
    await this.findById(id);
    await this.companyModel.findByIdAndUpdate(id, { status: 'deleted' });
    return { message: `Empresa ${id} eliminada` };
  }

  // ─── Branches ──────────────────────────────────────────────────────────────

  async addBranch(companyId: string, dto: CreateBranchDto): Promise<CompanyDocument> {
    const company = await this.findById(companyId);
    company.sedes.push({ ...dto, active: true, cameras: [] });
    return company.save();
  }

  async updateBranch(
    companyId: string,
    branchIndex: number,
    dto: UpdateBranchDto,
  ): Promise<CompanyDocument> {
    const company = await this.findById(companyId);
    const branch = company.sedes[branchIndex];
    if (!branch) throw new NotFoundException(`Sede ${branchIndex} no existe`);
    Object.assign(branch, dto);
    company.markModified('sedes');
    return company.save();
  }

  async removeBranch(companyId: string, branchIndex: number): Promise<CompanyDocument> {
    const company = await this.findById(companyId);
    if (!company.sedes[branchIndex]) {
      throw new NotFoundException(`Sede ${branchIndex} no existe`);
    }
    // Soft delete: marcar como inactiva en lugar de borrar para preservar histórico
    company.sedes[branchIndex].active = false;
    company.markModified('sedes');
    return company.save();
  }

  async getBranches(companyId: string) {
    const company = await this.findById(companyId);
    return company.sedes.map((s, i) => ({ ...s, branchIndex: i }));
  }

  /** Añade la referencia de una cámara a la sede */
  async linkCamera(
    companyId: string,
    branchIndex: number,
    cameraId: Types.ObjectId,
  ): Promise<void> {
    const company = await this.findById(companyId);
    if (!company.sedes[branchIndex]) {
      throw new NotFoundException(`Sede ${branchIndex} no existe`);
    }
    const alreadyLinked = company.sedes[branchIndex].cameras.some(
      (c) => c.toString() === cameraId.toString(),
    );
    if (!alreadyLinked) {
      company.sedes[branchIndex].cameras.push(cameraId);
      company.markModified('sedes');
      await company.save();
    }
  }

  /** Remueve la referencia de una cámara de la sede */
  async unlinkCamera(
    companyId: string,
    branchIndex: number,
    cameraId: Types.ObjectId,
  ): Promise<void> {
    const company = await this.findById(companyId);
    if (!company.sedes[branchIndex]) return;
    company.sedes[branchIndex].cameras = company.sedes[branchIndex].cameras.filter(
      (c) => c.toString() !== cameraId.toString(),
    );
    company.markModified('sedes');
    await company.save();
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  async addUser(companyId: string, dto: AddUserDto): Promise<CompanyDocument> {
    const company = await this.findById(companyId);
    const already = company.users.find((u) => u.email === dto.email);
    if (already) throw new ConflictException(`${dto.email} ya está registrado en esta empresa`);
    company.users.push({ ...dto, active: true, branchIndexes: dto.branchIndexes ?? [] });
    return company.save();
  }

  async updateUser(
    companyId: string,
    email: string,
    dto: UpdateUserDto,
  ): Promise<CompanyDocument> {
    const company = await this.findById(companyId);
    const user = company.users.find((u) => u.email === email);
    if (!user) throw new NotFoundException(`Usuario ${email} no encontrado`);
    Object.assign(user, dto);
    company.markModified('users');
    return company.save();
  }

  async removeUser(companyId: string, email: string): Promise<CompanyDocument> {
    const company = await this.findById(companyId);
    const idx = company.users.findIndex((u) => u.email === email);
    if (idx === -1) throw new NotFoundException(`Usuario ${email} no encontrado`);
    company.users[idx].active = false;
    company.markModified('users');
    return company.save();
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
