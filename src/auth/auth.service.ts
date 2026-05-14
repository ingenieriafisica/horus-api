import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { CompaniesService } from '../companies/companies.service';
import { MailService } from './mail.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';

const OTP_TTL_SECONDS    = 600;  // 10 min
const OTP_MAX_ATTEMPTS   = 3;
const OTP_BLOCK_SECONDS  = 900;  // 15 min
const REFRESH_TTL_DAYS   = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService:        JwtService,
    private readonly companiesService:  CompaniesService,
    private readonly mailService:       MailService,
    private readonly blacklistService:  TokenBlacklistService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ─── 1. Solicitar OTP ──────────────────────────────────────────────────────

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; expiresIn: number }> {
    const email = dto.email.toLowerCase().trim();

    // Verificar bloqueo activo
    const ttlBlock = await this.redis.ttl(`otp:block:${email}`);
    if (ttlBlock > 0) {
      throw new BadRequestException(
        `Demasiados intentos fallidos. Espera ${Math.ceil(ttlBlock / 60)} minuto(s).`,
      );
    }

    // Respuesta genérica para no revelar si el email está registrado
    const genericResponse = {
      message: 'Si el correo está registrado, recibirás un código de acceso.',
      expiresIn: OTP_TTL_SECONDS,
    };

    const company = await this.companiesService.findCompanyByUserEmail(email);
    if (!company) return genericResponse;

    const user = (company as any).users?.find(
      (u: any) => u.email === email && u.active,
    );
    if (!user) return genericResponse;

    // Generar y almacenar OTP
    const code = this.generateOtp();
    await Promise.all([
      this.redis.setex(`otp:code:${email}`,     OTP_TTL_SECONDS, code),
      this.redis.del(`otp:attempts:${email}`),  // reset intentos anteriores
    ]);

    // Enviar por correo (Nodemailer)
    await this.mailService.sendOtp(email, code, Math.floor(OTP_TTL_SECONDS / 60));

    this.logger.log(`OTP generado y enviado a ${email}`);
    return genericResponse;
  }

  // ─── 2. Verificar OTP y emitir JWT ────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    access_token:  string;
    refresh_token: string;
    token_type:    string;
    expires_in:    number;
    user: {
      email:         string;
      role:          string;
      companyId:     string;
      companyName:   string;
      branchIndexes: number[];
    };
  }> {
    const email       = dto.email.toLowerCase().trim();
    const otpKey      = `otp:code:${email}`;
    const attemptsKey = `otp:attempts:${email}`;
    const blockKey    = `otp:block:${email}`;

    // Verificar bloqueo
    const ttlBlock = await this.redis.ttl(blockKey);
    if (ttlBlock > 0) {
      throw new UnauthorizedException(
        `Cuenta bloqueada. Espera ${Math.ceil(ttlBlock / 60)} minuto(s).`,
      );
    }

    // Verificar existencia del OTP
    const storedCode = await this.redis.get(otpKey);
    if (!storedCode) {
      throw new UnauthorizedException(
        'El código ha expirado o no existe. Solicita uno nuevo.',
      );
    }

    // Comparar en tiempo constante (previene timing attacks)
    const isValid = this.safeCompare(storedCode, dto.code);

    if (!isValid) {
      const attempts = await this.redis.incr(attemptsKey);
      await this.redis.expire(attemptsKey, OTP_TTL_SECONDS);

      if (attempts >= OTP_MAX_ATTEMPTS) {
        // Bloquear cuenta y limpiar OTP
        await Promise.all([
          this.redis.setex(blockKey, OTP_BLOCK_SECONDS, '1'),
          this.redis.del(otpKey, attemptsKey),
        ]);
        throw new UnauthorizedException(
          `Demasiados intentos. Cuenta bloqueada por ${OTP_BLOCK_SECONDS / 60} minutos.`,
        );
      }

      const remaining = OTP_MAX_ATTEMPTS - attempts;
      throw new UnauthorizedException(
        `Código incorrecto. ${remaining} intento(s) restante(s).`,
      );
    }

    // OTP válido → invalidar de inmediato (un solo uso)
    await this.redis.del(otpKey, attemptsKey);

    // Cargar datos del usuario
    const company = await this.companiesService.findCompanyByUserEmail(email);
    if (!company || (company as any).status !== 'active') {
      throw new UnauthorizedException('Empresa no encontrada o suspendida.');
    }

    const user = (company as any).users?.find(
      (u: any) => u.email === email && u.active,
    );
    if (!user) throw new UnauthorizedException('Usuario inactivo.');

    // Actualizar last_login sin bloquear la respuesta
    this.companiesService.updateUser(
      (company as any)._id.toString(), email, {}
    ).catch((e) => this.logger.warn('Error actualizando last_login:', e));

    // Construir payload del JWT
    const payload: JwtPayload = {
      sub:          email,
      companyId:    (company as any)._id.toString(),
      role:         user.role,
      branchIndexes: user.branchIndexes ?? [],
    };

    const expiresIn     = 8 * 60 * 60; // 8 horas en segundos
    const access_token  = this.jwtService.sign(payload, { expiresIn });
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: `${REFRESH_TTL_DAYS}d`,
    });

    // Guardar refresh token en Redis (invalidable en logout)
    await this.redis.setex(
      `refresh:${email}`,
      60 * 60 * 24 * REFRESH_TTL_DAYS,
      refresh_token,
    );

    this.logger.log(`Login exitoso: ${email} [${user.role}]`);

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user: {
        email,
        role:          user.role,
        companyId:     (company as any)._id.toString(),
        companyName:   (company as any).nombre,
        branchIndexes: user.branchIndexes ?? [],
      },
    };
  }

  // ─── 3. Renovar access token con refresh token ────────────────────────────

  async refresh(refreshToken: string): Promise<{
    access_token: string;
    token_type:   string;
    expires_in:   number;
  }> {
    // Verificar que el refresh token no está en blacklist
    const isRevoked = await this.blacklistService.isBlacklisted(refreshToken);
    if (isRevoked) {
      throw new UnauthorizedException('Refresh token revocado. Inicia sesión de nuevo.');
    }

    // Verificar firma y expiración
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    // Verificar que es el refresh token más reciente (rotación)
    const stored = await this.redis.get(`refresh:${payload.sub}`);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException(
        'Refresh token no reconocido. Por seguridad, inicia sesión de nuevo.',
      );
    }

    // Emitir nuevo access token con el mismo payload
    const expiresIn = 8 * 60 * 60;
    const access_token = this.jwtService.sign(
      {
        sub:          payload.sub,
        companyId:    payload.companyId,
        role:         payload.role,
        branchIndexes: payload.branchIndexes,
      },
      { expiresIn },
    );

    return { access_token, token_type: 'Bearer', expires_in: expiresIn };
  }

  // ─── 4. Logout (blacklist access + refresh) ────────────────────────────────

  async logout(
    accessToken: string,
    email: string,
  ): Promise<{ message: string }> {
    // Añadir access token a blacklist hasta su expiración natural
    await this.blacklistService.blacklist(accessToken);

    // Recuperar y blacklistear el refresh token almacenado
    const refreshToken = await this.redis.get(`refresh:${email}`);
    if (refreshToken) {
      await this.blacklistService.blacklist(refreshToken);
    }

    // Eliminar refresh token de Redis
    await this.redis.del(`refresh:${email}`);

    this.logger.log(`Logout: ${email}`);
    return { message: 'Sesión cerrada correctamente.' };
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────

  /** Genera un OTP de 6 dígitos con relleno de ceros a la izquierda. */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
  }

  /**
   * Comparación en tiempo constante para evitar timing attacks.
   * Ambas cadenas deben tener la misma longitud para que sea efectiva.
   */
  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }
}