"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const core_1 = require("@nestjs/core");
const ioredis_1 = require("@nestjs-modules/ioredis");
const company_schema_1 = require("./companies/entities/company.schema");
const count_schema_1 = require("./counts/entities/count.schema");
const companies_service_1 = require("./companies/companies.service");
const cameras_service_1 = require("./cameras/cameras.service");
const counts_service_1 = require("./counts/counts.service");
const auth_service_1 = require("./auth/auth.service");
const companies_controller_1 = require("./companies/companies.controller");
const cameras_controller_1 = require("./cameras/cameras.controller");
const counts_controller_1 = require("./counts/counts.controller");
const auth_controller_1 = require("./auth/auth.controller");
const guards_1 = require("./common/guards");
const auth_module_1 = require("./auth/auth.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            mongoose_1.MongooseModule.forRootAsync({
                useFactory: () => ({
                    uri: process.env.MONGODB_URI ?? 'mongodb://nadc1000:8LdYHRlhQqNE55mH@ac-3u1ryyc-shard-00-00.j7vokv6.mongodb.net:27017,ac-3u1ryyc-shard-00-01.j7vokv6.mongodb.net:27017,ac-3u1ryyc-shard-00-02.j7vokv6.mongodb.net:27017/peoplecount?ssl=true&replicaSet=atlas-ce31v3-shard-0&authSource=admin&appName=Cluster0',
                }),
            }),
            mongoose_1.MongooseModule.forFeature([
                { name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema },
                { name: company_schema_1.Camera.name, schema: company_schema_1.CameraSchema },
                { name: count_schema_1.Count.name, schema: count_schema_1.CountSchema },
            ]),
            ioredis_1.RedisModule.forRootAsync({
                useFactory: () => {
                    const redisHost = process.env.REDIS_HOST ?? '172.22.4.134';
                    const redisPort = Number(process.env.REDIS_PORT ?? '6379');
                    const redisUrl = process.env.REDIS_URL ?? `redis://${redisHost}:${redisPort}`;
                    return {
                        type: 'single',
                        url: redisUrl,
                        options: {
                            maxRetriesPerRequest: 3,
                            retryStrategy: (times) => Math.min(times * 50, 2000),
                            reconnectOnError: (err) => {
                                return ['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED']
                                    .some((code) => err.message.includes(code));
                            },
                            connectTimeout: 10000,
                            keepAlive: 10000,
                        },
                        onClientReady: (client) => {
                            client.on('error', (err) => {
                                console.error('[Redis] connection error:', err.message || err);
                            });
                        },
                    };
                },
            }),
        ],
        controllers: [
            auth_controller_1.AuthController,
            companies_controller_1.CompaniesController,
            cameras_controller_1.CamerasController,
            counts_controller_1.CountsController,
        ],
        providers: [
            auth_service_1.AuthService,
            companies_service_1.CompaniesService,
            cameras_service_1.CamerasService,
            counts_service_1.CountsService,
            { provide: core_1.APP_GUARD, useClass: guards_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: guards_1.RolesGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map