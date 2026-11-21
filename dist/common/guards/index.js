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
exports.TenantGuard = exports.TenantIdParam = exports.TENANT_ID_PARAM_KEY = void 0;
exports.assertBranchAccess = assertBranchAccess;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../../auth/decorators/public.decorator");
exports.TENANT_ID_PARAM_KEY = 'tenantIdParam';
const TenantIdParam = (paramName = 'id') => (0, common_1.SetMetadata)(exports.TENANT_ID_PARAM_KEY, paramName);
exports.TenantIdParam = TenantIdParam;
let TenantGuard = class TenantGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.UnauthorizedException();
        if (user.role === 'super_admin')
            return true;
        const idParamName = this.reflector.getAllAndOverride(exports.TENANT_ID_PARAM_KEY, [context.getHandler(), context.getClass()]);
        const requestedCompanyId = request.params?.companyId ||
            (idParamName ? request.params?.[idParamName] : undefined) ||
            request.query?.companyId ||
            request.body?.companyId;
        if (requestedCompanyId && requestedCompanyId !== user.companyId) {
            throw new common_1.ForbiddenException('No autorizado para acceder a esta empresa');
        }
        return true;
    }
};
exports.TenantGuard = TenantGuard;
exports.TenantGuard = TenantGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], TenantGuard);
function assertBranchAccess(user, branchIndex) {
    if (!user || branchIndex === undefined)
        return;
    if (user.role === 'admin' || user.role === 'super_admin')
        return;
    const allowed = user.branchIndexes ?? [];
    if (allowed.length > 0 && !allowed.includes(branchIndex)) {
        throw new common_1.ForbiddenException(`No tienes permiso para acceder a la sede ${branchIndex}`);
    }
}
//# sourceMappingURL=index.js.map