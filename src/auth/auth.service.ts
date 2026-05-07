import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Company, CompanyDocument } from '../companies/entities/company.schema';
import { CompaniesService } from '../companies/companies.service';
import { RequestOtpDto, VerifyOtpDto } from '../common/dto';

const OTP_TTL_SECONDS = 600;      // 10 minutos
const OTP_MAX_ATTEMPTS = 3;
const OTP_BLOCK_SECONDS = 900;    // 15 minutos de bloqueo

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly companiesService: CompaniesService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ─── Solicitar OTP ─────────────────────────────────────────────────────────

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; expiresIn: number }> {
    const email = dto.email.toLowerCase().trim();

    // Verificar bloqueo por intentos fallidos
    const blockKey = `otp:block:${email}`;
    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      const ttl = await this.redis.ttl(blockKey);
      throw new BadRequestException(`Demasiados intentos. Espera ${Math.ceil(ttl / 60)} minutos.`);
    }

    // Verificar que el email pertenece a un usuario activo en alguna empresa
    const company = await this.companiesService.findCompanyByUserEmail(email);
    if (!company) {
      // No revelar si el email existe o no (seguridad)
      return { message: 'Si el correo está registrado, recibirás un código.', expiresIn: OTP_TTL_SECONDS };
    }

    // Generar código OTP de 6 dígitos
    const code = this.generateOtp();

    // Guardar en Redis: clave única por email
    const otpKey = `otp:code:${email}`;
    const attemptsKey = `otp:attempts:${email}`;

    await this.redis.setex(otpKey, OTP_TTL_SECONDS, code);
    await this.redis.del(attemptsKey); // reset intentos

    // ⚠️ En producción: enviar el código por email/SMS aquí
    // await this.mailerService.sendOtp(email, code);
    console.log(`[DEV] OTP para ${email}: ${code}`); // solo para desarrollo

    return { message: 'Si el correo está registrado, recibirás un código.', expiresIn: OTP_TTL_SECONDS };
  }

  // ─── Verificar OTP ─────────────────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto): Promise<{ access_token: string; refresh_token: string; user: object }> {
    const email = dto.email.toLowerCase().trim();
    const otpKey = `otp:code:${email}`;
    const attemptsKey = `otp:attempts:${email}`;
    const blockKey = `otp:block:${email}`;

    // Verificar bloqueo
    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      const ttl = await this.redis.ttl(blockKey);
      throw new UnauthorizedException(`Cuenta bloqueada. Espera ${Math.ceil(ttl / 60)} minutos.`);
    }

    // Obtener el OTP almacenado
    const storedCode = await this.redis.get(otpKey);
    if (!storedCode) {
      throw new UnauthorizedException('El código ha expirado o no existe. Solicita uno nuevo.');
    }

    // Comparar código
    if (storedCode !== dto.code) {
      // Incrementar intentos fallidos
      const attempts = await this.redis.incr(attemptsKey);
      await this.redis.expire(attemptsKey, OTP_TTL_SECONDS);

      if (attempts >= OTP_MAX_ATTEMPTS) {
        await this.redis.setex(blockKey, OTP_BLOCK_SECONDS, '1');
        await this.redis.del(otpKey, attemptsKey);
        throw new UnauthorizedException('Demasiados intentos fallidos. Cuenta bloqueada 15 minutos.');
      }

      throw new UnauthorizedException(`Código incorrecto. ${OTP_MAX_ATTEMPTS - attempts} intento(s) restante(s).`);
    }

    // Código válido: invalidar OTP (un solo uso)
    await this.redis.del(otpKey, attemptsKey);

    // Obtener datos del usuario
    const company = await this.companiesService.findCompanyByUserEmail(email);
    if (!company) throw new UnauthorizedException('Usuario no encontrado');

    const user = (company as any).users.find((u: any) => u.email === email && u.active);
    if (!user) throw new UnauthorizedException('Usuario inactivo');

    // Actualizar last_login
    await this.companiesService.updateUser(company._id.toString(), email, {});

    // Generar JWT
    const payload = {
      sub: email,
      companyId: company._id.toString(),
      role: user.role,
      branchIndexes: user.branchIndexes,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '8h' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '30d' });

    // Guardar refresh token en Redis para invalidación
    await this.redis.setex(
      `refresh:${email}`,
      60 * 60 * 24 * 30,
      refresh_token,
    );

    return {
      access_token,
      refresh_token,
      user: {
        email,
        role: user.role,
        companyId: company._id,
        companyName: (company as any).nombre,
        branchIndexes: user.branchIndexes,
      },
    };
  }

  // ─── Refresh Token ─────────────────────────────────────────────────────────

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const stored = await this.redis.get(`refresh:${payload.sub}`);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    const newPayload = {
      sub: payload.sub,
      companyId: payload.companyId,
      role: payload.role,
      branchIndexes: payload.branchIndexes,
    };

    return {
      access_token: this.jwtService.sign(newPayload, { expiresIn: '8h' }),
    };
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  async logout(email: string): Promise<{ message: string }> {
    await this.redis.del(`refresh:${email}`);
    return { message: 'Sesión cerrada correctamente' };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
