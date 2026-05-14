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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const token_blacklist_service_1 = require("./token-blacklist.service");
const companies_service_1 = require("../companies/companies.service");
const dotenv = require("dotenv");
dotenv.config();
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(blacklistService, companiesService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
            passReqToCallback: true,
        });
        this.blacklistService = blacklistService;
        this.companiesService = companiesService;
    }
    async validate(req, payload) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            throw new common_1.UnauthorizedException('Token no proporcionado');
        const revoked = await this.blacklistService.isBlacklisted(token);
        if (revoked) {
            throw new common_1.UnauthorizedException('La sesión fue cerrada. Vuelve a iniciar sesión.');
        }
        const company = await this.companiesService.findCompanyByUserEmail(payload.sub);
        if (!company || company.status !== 'active') {
            throw new common_1.UnauthorizedException('Empresa suspendida o no encontrada');
        }
        const user = company.users.find((u) => u.email === payload.sub && u.active);
        if (!user) {
            throw new common_1.UnauthorizedException('Usuario inactivo o no encontrado');
        }
        return {
            email: payload.sub,
            companyId: payload.companyId,
            role: payload.role,
            branchIndexes: payload.branchIndexes,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [token_blacklist_service_1.TokenBlacklistService,
        companies_service_1.CompaniesService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map