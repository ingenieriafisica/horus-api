"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const core_1 = require("@nestjs/core");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const jwt_strategy_1 = require("./jwt.strategy");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const roles_guard_1 = require("./roles.guard");
const mail_service_1 = require("./mail.service");
const token_blacklist_service_1 = require("./token-blacklist.service");
const companies_module_1 = require("../companies/companies.module");
const dotenv = require("dotenv");
dotenv.config();
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                global: true,
                useFactory: () => ({
                    secret: process.env.JWT_SECRET,
                    signOptions: {
                        expiresIn: '8h',
                        algorithm: 'HS256',
                        issuer: 'peoplecount-api',
                        audience: 'peoplecount-clients',
                    },
                }),
            }),
            companies_module_1.CompaniesModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            mail_service_1.MailService,
            token_blacklist_service_1.TokenBlacklistService,
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
        exports: [auth_service_1.AuthService, token_blacklist_service_1.TokenBlacklistService, mail_service_1.MailService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map