"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const ioredis_1 = require("@nestjs-modules/ioredis");
const ioredis_2 = __importDefault(require("ioredis"));
const companies_service_1 = require("../companies/companies.service");
const mail_service_1 = require("./mail.service");
const token_blacklist_service_1 = require("./token-blacklist.service");
const OTP_TTL_SECONDS = 600;
const OTP_MAX_ATTEMPTS = 3;
const OTP_BLOCK_SECONDS = 900;
const REFRESH_TTL_DAYS = 30;
const keys = {
    otpCode: (email) => `otp:code:${email}`,
    otpCid: (email) => `otp:cid:${email}`,
    otpAttempts: (cid, email) => `tenant:${cid}:otp:attempts:${email}`,
    otpBlock: (cid, email) => `tenant:${cid}:otp:block:${email}`,
    refresh: (cid, email) => `tenant:${cid}:refresh:${email}`,
};
let AuthService = AuthService_1 = class AuthService {
    constructor(jwtService, companiesService, mailService, blacklistService, redis) {
        this.jwtService = jwtService;
        this.companiesService = companiesService;
        this.mailService = mailService;
        this.blacklistService = blacklistService;
        this.redis = redis;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async requestOtp(dto) {
        const email = dto.email.toLowerCase().trim();
        const genericResponse = {
            message: 'Si el correo está registrado, recibirás un código de acceso.',
            expiresIn: OTP_TTL_SECONDS,
        };
        const company = await this.companiesService.findCompanyByUserEmail(email);
        if (!company)
            return genericResponse;
        const user = company.users?.find((u) => u.email === email && u.active);
        if (!user)
            return genericResponse;
        const cid = company._id.toString();
        const ttlBlock = await this.redis.ttl(keys.otpBlock(cid, email));
        if (ttlBlock > 0) {
            throw new common_1.BadRequestException(`Demasiados intentos fallidos. Espera ${Math.ceil(ttlBlock / 60)} minuto(s).`);
        }
        const code = this.generateOtp();
        await Promise.all([
            this.redis.setex(keys.otpCode(email), OTP_TTL_SECONDS, code),
            this.redis.setex(keys.otpCid(email), OTP_TTL_SECONDS + 30, cid),
            this.redis.del(keys.otpAttempts(cid, email)),
        ]);
        await this.mailService.sendOtp(email, code, Math.floor(OTP_TTL_SECONDS / 60));
        this.logger.log(`OTP generado para ${email} [tenant: ${cid}]`);
        return genericResponse;
    }
    async verifyOtp(dto) {
        const email = dto.email.toLowerCase().trim();
        const cid = (await this.redis.get(keys.otpCid(email))) ?? '';
        const ttlBlock = await this.redis.ttl(keys.otpBlock(cid, email));
        if (ttlBlock > 0) {
            throw new common_1.UnauthorizedException(`Cuenta bloqueada. Espera ${Math.ceil(ttlBlock / 60)} minuto(s).`);
        }
        const storedCode = await this.redis.get(keys.otpCode(email));
        if (!storedCode) {
            throw new common_1.UnauthorizedException('El código ha expirado o no existe. Solicita uno nuevo.');
        }
        const isValid = this.safeCompare(storedCode, dto.code);
        if (!isValid) {
            const attempts = await this.redis.incr(keys.otpAttempts(cid, email));
            await this.redis.expire(keys.otpAttempts(cid, email), OTP_TTL_SECONDS);
            if (attempts >= OTP_MAX_ATTEMPTS) {
                await Promise.all([
                    this.redis.setex(keys.otpBlock(cid, email), OTP_BLOCK_SECONDS, '1'),
                    this.redis.del(keys.otpCode(email), keys.otpAttempts(cid, email), keys.otpCid(email)),
                ]);
                throw new common_1.UnauthorizedException(`Demasiados intentos. Cuenta bloqueada por ${OTP_BLOCK_SECONDS / 60} minutos.`);
            }
            throw new common_1.UnauthorizedException(`Código incorrecto. ${OTP_MAX_ATTEMPTS - attempts} intento(s) restante(s).`);
        }
        await this.redis.del(keys.otpCode(email), keys.otpAttempts(cid, email), keys.otpCid(email));
        const company = await this.companiesService.findCompanyByUserEmail(email);
        if (!company || company.status !== 'active') {
            throw new common_1.UnauthorizedException('Empresa no encontrada o suspendida.');
        }
        const user = company.users?.find((u) => u.email === email && u.active);
        if (!user)
            throw new common_1.UnauthorizedException('Usuario inactivo.');
        const companyId = company._id.toString();
        this.companiesService
            .updateUser(companyId, email, {})
            .catch((e) => this.logger.warn('Error actualizando last_login:', e));
        const payload = {
            sub: email,
            companyId,
            role: user.role,
            branchIndexes: user.branchIndexes ?? [],
        };
        const expiresIn = 8 * 60 * 60;
        const access_token = this.jwtService.sign(payload, { expiresIn });
        const refresh_token = this.jwtService.sign(payload, { expiresIn: `${REFRESH_TTL_DAYS}d` });
        await this.redis.setex(keys.refresh(companyId, email), 60 * 60 * 24 * REFRESH_TTL_DAYS, refresh_token);
        this.logger.log(`Login exitoso: ${email} [${user.role}]`);
        return {
            access_token,
            refresh_token,
            token_type: 'Bearer',
            expires_in: expiresIn,
            user: { email, role: user.role, companyId, companyName: company.nombre, branchIndexes: user.branchIndexes ?? [] },
        };
    }
    async refresh(refreshToken) {
        const isRevoked = await this.blacklistService.isBlacklisted(refreshToken);
        if (isRevoked)
            throw new common_1.UnauthorizedException('Refresh token revocado. Inicia sesión de nuevo.');
        let payload;
        try {
            payload = this.jwtService.verify(refreshToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token inválido o expirado.');
        }
        const stored = await this.redis.get(keys.refresh(payload.companyId, payload.sub));
        if (!stored || stored !== refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token no reconocido. Por seguridad, inicia sesión de nuevo.');
        }
        const expiresIn = 8 * 60 * 60;
        const access_token = this.jwtService.sign({ sub: payload.sub, companyId: payload.companyId, role: payload.role, branchIndexes: payload.branchIndexes }, { expiresIn });
        return { access_token, token_type: 'Bearer', expires_in: expiresIn };
    }
    async logout(accessToken, email) {
        await this.blacklistService.blacklist(accessToken);
        const decoded = this.jwtService.decode(accessToken);
        const companyId = decoded?.companyId ?? '';
        const refreshToken = await this.redis.get(keys.refresh(companyId, email));
        if (refreshToken)
            await this.blacklistService.blacklist(refreshToken);
        await this.redis.del(keys.refresh(companyId, email));
        this.logger.log(`Logout: ${email}`);
        return { message: 'Sesión cerrada correctamente.' };
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
    }
    safeCompare(a, b) {
        if (a.length !== b.length)
            return false;
        let diff = 0;
        for (let i = 0; i < a.length; i++)
            diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
        return diff === 0;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        companies_service_1.CompaniesService,
        mail_service_1.MailService,
        token_blacklist_service_1.TokenBlacklistService,
        ioredis_2.default])
], AuthService);
//# sourceMappingURL=auth.service.js.map