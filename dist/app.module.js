"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const ioredis_1 = require("@nestjs-modules/ioredis");
const count_schema_1 = require("./counts/entities/count.schema");
const audit_module_1 = require("./audit/audit.module");
const auth_module_1 = require("./auth/auth.module");
const companies_module_1 = require("./companies/companies.module");
const radars_module_1 = require("./radars/radars.module");
const alerts_module_1 = require("./alerts/alerts.module");
const counts_service_1 = require("./counts/counts.service");
const counts_controller_1 = require("./counts/counts.controller");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            companies_module_1.CompaniesModule,
            radars_module_1.RadarsModule,
            alerts_module_1.AlertsModule,
            mongoose_1.MongooseModule.forRootAsync({
                useFactory: () => ({
                    uri: process.env.MONGODB_URI,
                    connectionFactory: (connection) => {
                        connection.on('connected', () => console.log('[MongoDB] Conectado'));
                        connection.on('error', (err) => console.error('[MongoDB] Error:', err.message));
                        return connection;
                    },
                }),
            }),
            mongoose_1.MongooseModule.forFeature([
                { name: count_schema_1.Count.name, schema: count_schema_1.CountSchema },
            ]),
            ioredis_1.RedisModule.forRootAsync({
                useFactory: () => {
                    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
                    return {
                        type: 'single',
                        url: redisUrl,
                        options: {
                            maxRetriesPerRequest: 3,
                            retryStrategy: (times) => Math.min(times * 50, 2000),
                            reconnectOnError: (err) => ['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED'].some((c) => err.message.includes(c)),
                            connectTimeout: 10000,
                            keepAlive: 10000,
                        },
                        onClientReady: (client) => {
                            client.on('error', (err) => console.error('[Redis] error:', err.message));
                        },
                    };
                },
            }),
        ],
        controllers: [counts_controller_1.CountsController],
        providers: [counts_service_1.CountsService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map