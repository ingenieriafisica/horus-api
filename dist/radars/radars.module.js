"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadarsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const radars_service_1 = require("./radars.service");
const radars_controller_1 = require("./radars.controller");
const radar_schema_1 = require("./entities/radar.schema");
const companies_module_1 = require("../companies/companies.module");
let RadarsModule = class RadarsModule {
};
exports.RadarsModule = RadarsModule;
exports.RadarsModule = RadarsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: radar_schema_1.Radar.name, schema: radar_schema_1.RadarSchema }]),
            companies_module_1.CompaniesModule,
        ],
        controllers: [radars_controller_1.RadarsController],
        providers: [radars_service_1.RadarsService],
        exports: [radars_service_1.RadarsService],
    })
], RadarsModule);
//# sourceMappingURL=radars.module.js.map