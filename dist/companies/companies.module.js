"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = exports.CountsModule = exports.CamerasModule = exports.CompaniesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const company_schema_1 = require("./entities/company.schema");
const companies_service_1 = require("./companies.service");
const companies_controller_1 = require("./companies.controller");
let CompaniesModule = class CompaniesModule {
};
exports.CompaniesModule = CompaniesModule;
exports.CompaniesModule = CompaniesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema }]),
        ],
        providers: [companies_service_1.CompaniesService],
        controllers: [companies_controller_1.CompaniesController],
        exports: [companies_service_1.CompaniesService],
    })
], CompaniesModule);
const company_schema_2 = require("../companies/entities/company.schema");
const cameras_service_1 = require("../cameras/cameras.service");
const cameras_controller_1 = require("../cameras/cameras.controller");
class CamerasModule {
}
exports.CamerasModule = CamerasModule;
CamerasModule.imports = [
    mongoose_1.MongooseModule.forFeature([{ name: company_schema_2.Camera.name, schema: company_schema_2.CameraSchema }]),
    CompaniesModule,
];
CamerasModule.providers = [cameras_service_1.CamerasService];
CamerasModule.controllers = [cameras_controller_1.CamerasController];
CamerasModule.exports = [cameras_service_1.CamerasService];
const company_schema_3 = require("../companies/entities/company.schema");
const counts_service_1 = require("../counts/counts.service");
const counts_controller_1 = require("../counts/counts.controller");
class CountsModule {
}
exports.CountsModule = CountsModule;
CountsModule.imports = [
    mongoose_1.MongooseModule.forFeature([{ name: company_schema_3.Count.name, schema: company_schema_3.CountSchema }]),
    CamerasModule,
];
CountsModule.providers = [counts_service_1.CountsService];
CountsModule.controllers = [counts_controller_1.CountsController];
const jwt_1 = require("@nestjs/jwt");
const auth_service_1 = require("../auth/auth.service");
const auth_controller_1 = require("../auth/auth.controller");
class AuthModule {
}
exports.AuthModule = AuthModule;
AuthModule.imports = [
    jwt_1.JwtModule.registerAsync({
        useFactory: () => ({
            secret: process.env.JWT_SECRET ?? 'change-me-in-production',
            signOptions: { algorithm: 'HS256' },
        }),
    }),
    CompaniesModule,
];
AuthModule.providers = [auth_service_1.AuthService];
AuthModule.controllers = [auth_controller_1.AuthController];
//# sourceMappingURL=companies.module.js.map