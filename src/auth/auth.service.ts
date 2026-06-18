import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { CompaniesService } from '../companies/companies.service';
import { MailService } from './mail.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';

const OTP_TTL_SECONDS   = 600;   // 10 min
const OTP_MAX_ATTEMPTS  = 3;
const OTP_BLOCK_SECONDS = 900;   // 15 min
const REFRESH_TTL_DAYS  = 30;

// Helpers de claves Redis — toda la lógica de naming en un solo lugar
const keys = {
  otpCode:     (email: string)              => `otp:code:${email}`,
  otpCid:      (email: string)              => `otp:cid:${email}`,
  otpAttempts: (cid: string, email: string) => `tenant:${cid}:otp:attempts:${email}`,
  otpBlock:    (cid: string, email: string) => `tenant:${cid}:otp:block:${email}`,
  refresh:     (cid: string, email: string) => `tenant:${cid}:refresh:${email}`,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService:       JwtService,
    private readonly companiesService: CompaniesService,
    private readonly mailService:      MailService,
    private readonly blacklistService: TokenBlacklistService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ─── 1. Solicitar OTP ──────────────────────────────────────────────────────

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; expiresIn: number }> {
    const email = dto.email.toLowerCase().trim();

    const genericResponse = {
      message: 'Si el correo está registrado, recibirás un código de acceso.',
      expiresIn: OTP_TTL_SECONDS,
    };

    const company = await this.companiesService.findCompanyByUserEmail(email);
    if (!company) return genericResponse;

    const user = (company as any).users?.find((u: any) => u.email === email && u.active);
    if (!user) return genericResponse;

    const cid = (company as any)._id.toString();

    // Verificar bloqueo activo (namespaciado por tenant)
    const ttlBlock = await this.redis.ttl(keys.otpBlock(cid, email));
    if (ttlBlock > 0) {
      throw new BadRequestException(
        `Demasiados intentos fallidos. Espera ${Math.ceil(ttlBlock / 60)} minuto(s).`,
      );
    }

    const code = this.generateOtp();
    await Promise.all([
      this.redis.setex(keys.otpCode(email),     OTP_TTL_SECONDS,      code),
      this.redis.setex(keys.otpCid(email),      OTP_TTL_SECONDS + 30, cid),  // mapping email→tenant
      this.redis.del  (keys.otpAttempts(cid, email)),                         // reset intentos
    ]);

    await this.mailService.sendOtp(email, code, Math.floor(OTP_TTL_SECONDS / 60));
    this.logger.log(`OTP generado para ${email} [tenant: ${cid}]`);
    return genericResponse;
  }

  // ─── 2. Verificar OTP y emitir JWT ────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    access_token:  string;
    refresh_token: string;
    token_type:    string;
    expires_in:    number;
    user: { email: string; role: string; companyId: string; companyName: string; branchIndexes: number[] };
  }> {
    const email = dto.email.toLowerCase().trim();

    // Resolver companyId desde el mapping guardado al pedir el OTP
    const cid = (await this.redis.get(keys.otpCid(email))) ?? '';

    // Verificar bloqueo
    const ttlBlock = await this.redis.ttl(keys.otpBlock(cid, email));
    if (ttlBlock > 0) {
      throw new UnauthorizedException(
        `Cuenta bloqueada. Espera ${Math.ceil(ttlBlock / 60)} minuto(s).`,
      );
    }

    // Verificar existencia del OTP
    const storedCode = await this.redis.get(keys.otpCode(email));
    if (!storedCode) {
      throw new UnauthorizedException('El código ha expirado o no existe. Solicita uno nuevo.');
    }

    // Comparación en tiempo constante (previene timing attacks)
    const isValid = this.safeCompare(storedCode, dto.code);

    if (!isValid) {
      const attempts = await this.redis.incr(keys.otpAttempts(cid, email));
      await this.redis.expire(keys.otpAttempts(cid, email), OTP_TTL_SECONDS);

      if (attempts >= OTP_MAX_ATTEMPTS) {
        await Promise.all([
          this.redis.setex(keys.otpBlock(cid, email), OTP_BLOCK_SECONDS, '1'),
          this.redis.del(keys.otpCode(email), keys.otpAttempts(cid, email), keys.otpCid(email)),
        ]);
        throw new UnauthorizedException(
          `Demasiados intentos. Cuenta bloqueada por ${OTP_BLOCK_SECONDS / 60} minutos.`,
        );
      }

      throw new UnauthorizedException(
        `Código incorrecto. ${OTP_MAX_ATTEMPTS - attempts} intento(s) restante(s).`,
      );
    }

    // OTP válido → borrar inmediatamente (uso único)
    await this.redis.del(keys.otpCode(email), keys.otpAttempts(cid, email), keys.otpCid(email));

    // Cargar datos del usuario
    const company = await this.companiesService.findCompanyByUserEmail(email);
    if (!company || (company as any).status !== 'active') {
      throw new UnauthorizedException('Empresa no encontrada o suspendida.');
    }

    const user = (company as any).users?.find((u: any) => u.email === email && u.active);
    if (!user) throw new UnauthorizedException('Usuario inactivo.');

    const companyId = (company as any)._id.toString();

    // Actualizar last_login sin bloquear la respuesta
    this.companiesService
      .updateUser(companyId, email, {})
      .catch((e) => this.logger.warn('Error actualizando last_login:', e));

    const payload: JwtPayload = {
      sub:          email,
      companyId,
      role:         user.role,
      branchIndexes: user.branchIndexes ?? [],
    };

    const expiresIn     = 8 * 60 * 60;
    const access_token  = this.jwtService.sign(payload, { expiresIn });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: `${REFRESH_TTL_DAYS}d` });

    await this.redis.setex(
      keys.refresh(companyId, email),
      60 * 60 * 24 * REFRESH_TTL_DAYS,
      refresh_token,
    );

    this.logger.log(`Login exitoso: ${email} [${user.role}]`);

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user: { email, role: user.role, companyId, companyName: (company as any).nombre, branchIndexes: user.branchIndexes ?? [] },
    };
  }

  // ─── 3. Renovar access token con refresh token ────────────────────────────

  async refresh(refreshToken: string): Promise<{
    access_token: string;
    token_type:   string;
    expires_in:   number;
  }> {
    const isRevoked = await this.blacklistService.isBlacklisted(refreshToken);
    if (isRevoked) throw new UnauthorizedException('Refresh token revocado. Inicia sesión de nuevo.');

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    // Verificar que es el refresh token más reciente (previene reutilización)
    const stored = await this.redis.get(keys.refresh(payload.companyId, payload.sub));
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Refresh token no reconocido. Por seguridad, inicia sesión de nuevo.');
    }

    const expiresIn    = 8 * 60 * 60;
    const access_token = this.jwtService.sign(
      { sub: payload.sub, companyId: payload.companyId, role: payload.role, branchIndexes: payload.branchIndexes },
      { expiresIn },
    );

    return { access_token, token_type: 'Bearer', expires_in: expiresIn };
  }

  // ─── 4. Logout (blacklist access + refresh) ────────────────────────────────

  async logout(accessToken: string, email: string): Promise<{ message: string }> {
    await this.blacklistService.blacklist(accessToken);

    // Decodificar sin verificar para obtener companyId (el guard ya lo validó)
    const decoded = this.jwtService.decode(accessToken) as JwtPayload | null;
    const companyId = decoded?.companyId ?? '';

    const refreshToken = await this.redis.get(keys.refresh(companyId, email));
    if (refreshToken) await this.blacklistService.blacklist(refreshToken);
    await this.redis.del(keys.refresh(companyId, email));

    this.logger.log(`Logout: ${email}`);
    return { message: 'Sesión cerrada correctamente.' };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }
}
