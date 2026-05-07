import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Camera, CameraDocument } from '../companies/entities/company.schema';
import { CompaniesService } from '../companies/companies.service';
import { CreateCameraDto, UpdateCameraDto, HeartbeatDto } from '../common/dto';

@Injectable()
export class CamerasService {
  constructor(
    @InjectModel(Camera.name)
    private readonly cameraModel: Model<CameraDocument>,
    private readonly companiesService: CompaniesService,
  ) {}

  // ─── Registro ──────────────────────────────────────────────────────────────

  async create(dto: CreateCameraDto): Promise<CameraDocument> {
    // Verificar que la empresa y la sede existan
    const company = await this.companiesService.findById(dto.companyId);
    if (!company.sedes[dto.branchIndex]) {
      throw new NotFoundException(`Sede ${dto.branchIndex} no existe en la empresa`);
    }

    const exists = await this.cameraModel.findOne({ uid_hardware: dto.uid_hardware }).lean();
    if (exists) throw new ConflictException(`uid_hardware '${dto.uid_hardware}' ya registrado`);

    const camera = await new this.cameraModel({
      ...dto,
      companyId: new Types.ObjectId(dto.companyId),
      status: 'active',
    }).save();

    // Vincular la cámara en el array de la sede
    await this.companiesService.linkCamera(
      dto.companyId,
      dto.branchIndex,
      camera._id as Types.ObjectId,
    );

    return camera;
  }

  // ─── Consultas ─────────────────────────────────────────────────────────────

  async findByCompany(companyId: string): Promise<CameraDocument[]> {
    return this.cameraModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .lean() as unknown as CameraDocument[];
  }

  async findByBranch(companyId: string, branchIndex: number): Promise<CameraDocument[]> {
    return this.cameraModel
      .find({ companyId: new Types.ObjectId(companyId), branchIndex })
      .lean() as unknown as CameraDocument[];
  }

  async findById(id: string): Promise<CameraDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const cam = await this.cameraModel.findById(id).exec();
    if (!cam) throw new NotFoundException(`Cámara ${id} no encontrada`);
    return cam;
  }

  async findByHardwareUid(uid: string): Promise<CameraDocument | null> {
    return this.cameraModel.findOne({ uid_hardware: uid }).exec();
  }

  // ─── Actualización ─────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateCameraDto): Promise<CameraDocument> {
    const cam = await this.findById(id);
    Object.assign(cam, dto);
    return cam.save();
  }

  async deactivate(id: string, companyId: string): Promise<{ message: string }> {
    const cam = await this.findById(id);
    if (cam.companyId.toString() !== companyId) {
      throw new UnauthorizedException('No autorizado para esta cámara');
    }
    cam.status = 'inactive';
    await cam.save();

    await this.companiesService.unlinkCamera(
      companyId,
      cam.branchIndex,
      cam._id as Types.ObjectId,
    );

    return { message: `Cámara ${id} desactivada` };
  }

  // ─── Heartbeat (llamado por el ESP32 periódicamente) ─────────────────────

  async heartbeat(dto: HeartbeatDto): Promise<{ status: string }> {
    const cam = await this.cameraModel.findOne({ uid_hardware: dto.uid_hardware });
    if (!cam) throw new UnauthorizedException('Dispositivo no registrado');

    const update: Partial<Camera> = { last_seen: new Date() };
    if (dto.ip_local) update.ip_local = dto.ip_local;
    if (dto.firmware_version) update.firmware_version = dto.firmware_version;
    if (cam.status === 'error') update.status = 'active'; // auto-recovery

    await this.cameraModel.findByIdAndUpdate(cam._id, { $set: update });
    return { status: cam.status };
  }

  // ─── Estado del sistema ────────────────────────────────────────────────────

  async getStatusSummary(companyId: string) {
    const pipeline = [
      { $match: { companyId: new Types.ObjectId(companyId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];
    const result = await this.cameraModel.aggregate(pipeline);
    const summary: Record<string, number> = { active: 0, inactive: 0, error: 0 };
    result.forEach((r) => (summary[r._id] = r.count));
    return summary;
  }

  /** Valida que el uid_hardware pertenezca a la empresa indicada y está activa */
  async validateDevice(uid_hardware: string): Promise<CameraDocument> {
    const cam = await this.cameraModel.findOne({ uid_hardware, status: 'active' });
    if (!cam) throw new UnauthorizedException('Dispositivo no registrado o inactivo');
    return cam;
  }
}
