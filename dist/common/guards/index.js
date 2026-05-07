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
exports.TenantGuard = exports.RolesGuard = exports.ROLES_KEY = exports.JwtAuthGuard = exports.IS_PUBLIC_KEY = void 0;
exports.Public = Public;
exports.Roles = Roles;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const core_1 = require("@nestjs/core");
exports.IS_PUBLIC_KEY = 'isPublic';
function Public() {
    return (target, key, descriptor) => {
        Reflect.defineMetadata(exports.IS_PUBLIC_KEY, true, descriptor.value);
        return descriptor;
    };
}
let JwtAuthGuard = class JwtAuthGuard {
    constructor(jwtService, reflector) {
        this.jwtService = jwtService;
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.get(exports.IS_PUBLIC_KEY, context.getHandler());
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Token no proporcionado');
        }
        const token = authHeader.split(' ')[1];
        try {
            const payload = this.jwtService.verify(token);
            request.user = payload;
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('Token inválido o expirado');
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector])
], JwtAuthGuard);
exports.ROLES_KEY = 'roles';
function Roles(...roles) {
    return (target, key, descriptor) => {
        Reflect.defineMetadata(exports.ROLES_KEY, roles, descriptor.value);
        return descriptor;
    };
}
let RolesGuard = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.get(exports.ROLES_KEY, context.getHandler());
        if (!requiredRoles || requiredRoles.length === 0)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.UnauthorizedException('Usuario no autenticado');
        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new common_1.UnauthorizedException(`Rol requerido: ${requiredRoles.join(' | ')}. Tu rol: ${user.role}`);
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
let TenantGuard = class TenantGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.UnauthorizedException();
        if (user.role === 'super_admin')
            return true;
        const requestedCompanyId = request.params?.companyId ||
            request.params?.id ||
            request.query?.companyId ||
            request.body?.companyId;
        if (requestedCompanyId && requestedCompanyId !== user.companyId) {
            throw new common_1.UnauthorizedException('No autorizado para acceder a esta empresa');
        }
        return true;
    }
};
exports.TenantGuard = TenantGuard;
exports.TenantGuard = TenantGuard = __decorate([
    (0, common_1.Injectable)()
], TenantGuard);
//# sourceMappingURL=index.js.map