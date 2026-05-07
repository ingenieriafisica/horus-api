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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const ioredis_1 = require("@nestjs-modules/ioredis");
const ioredis_2 = require("ioredis");
const companies_service_1 = require("../companies/companies.service");
const OTP_TTL_SECONDS = 600;
const OTP_MAX_ATTEMPTS = 3;
const OTP_BLOCK_SECONDS = 900;
let AuthService = class AuthService {
    constructor(jwtService, companiesService, redis) {
        this.jwtService = jwtService;
        this.companiesService = companiesService;
        this.redis = redis;
    }
    async requestOtp(dto) {
        const email = dto.email.toLowerCase().trim();
        const blockKey = `otp:block:${email}`;
        const isBlocked = await this.redis.get(blockKey);
        if (isBlocked) {
            const ttl = await this.redis.ttl(blockKey);
            throw new common_1.BadRequestException(`Demasiados intentos. Espera ${Math.ceil(ttl / 60)} minutos.`);
        }
        const company = await this.companiesService.findCompanyByUserEmail(email);
        if (!company) {
            return { message: 'Si el correo está registrado, recibirás un código.', expiresIn: OTP_TTL_SECONDS };
        }
        const code = this.generateOtp();
        const otpKey = `otp:code:${email}`;
        const attemptsKey = `otp:attempts:${email}`;
        await this.redis.setex(otpKey, OTP_TTL_SECONDS, code);
        await this.redis.del(attemptsKey);
        console.log(`[DEV] OTP para ${email}: ${code}`);
        return { message: 'Si el correo está registrado, recibirás un código.', expiresIn: OTP_TTL_SECONDS };
    }
    async verifyOtp(dto) {
        const email = dto.email.toLowerCase().trim();
        const otpKey = `otp:code:${email}`;
        const attemptsKey = `otp:attempts:${email}`;
        const blockKey = `otp:block:${email}`;
        const isBlocked = await this.redis.get(blockKey);
        if (isBlocked) {
            const ttl = await this.redis.ttl(blockKey);
            throw new common_1.UnauthorizedException(`Cuenta bloqueada. Espera ${Math.ceil(ttl / 60)} minutos.`);
        }
        const storedCode = await this.redis.get(otpKey);
        if (!storedCode) {
            throw new common_1.UnauthorizedException('El código ha expirado o no existe. Solicita uno nuevo.');
        }
        if (storedCode !== dto.code) {
            const attempts = await this.redis.incr(attemptsKey);
            await this.redis.expire(attemptsKey, OTP_TTL_SECONDS);
            if (attempts >= OTP_MAX_ATTEMPTS) {
                await this.redis.setex(blockKey, OTP_BLOCK_SECONDS, '1');
                await this.redis.del(otpKey, attemptsKey);
                throw new common_1.UnauthorizedException('Demasiados intentos fallidos. Cuenta bloqueada 15 minutos.');
            }
            throw new common_1.UnauthorizedException(`Código incorrecto. ${OTP_MAX_ATTEMPTS - attempts} intento(s) restante(s).`);
        }
        await this.redis.del(otpKey, attemptsKey);
        const company = await this.companiesService.findCompanyByUserEmail(email);
        if (!company)
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        const user = company.users.find((u) => u.email === email && u.active);
        if (!user)
            throw new common_1.UnauthorizedException('Usuario inactivo');
        await this.companiesService.updateUser(company._id.toString(), email, {});
        const payload = {
            sub: email,
            companyId: company._id.toString(),
            role: user.role,
            branchIndexes: user.branchIndexes,
        };
        const access_token = this.jwtService.sign(payload, { expiresIn: '8h' });
        const refresh_token = this.jwtService.sign(payload, { expiresIn: '30d' });
        await this.redis.setex(`refresh:${email}`, 60 * 60 * 24 * 30, refresh_token);
        return {
            access_token,
            refresh_token,
            user: {
                email,
                role: user.role,
                companyId: company._id,
                companyName: company.nombre,
                branchIndexes: user.branchIndexes,
            },
        };
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = this.jwtService.verify(refreshToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token inválido o expirado');
        }
        const stored = await this.redis.get(`refresh:${payload.sub}`);
        if (!stored || stored !== refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token revocado');
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
    async logout(email) {
        await this.redis.del(`refresh:${email}`);
        return { message: 'Sesión cerrada correctamente' };
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        companies_service_1.CompaniesService,
        ioredis_2.default])
], AuthService);
//# sourceMappingURL=auth.service.js.map