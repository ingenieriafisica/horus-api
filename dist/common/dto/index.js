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
exports.VerifyOtpDto = exports.RequestOtpDto = exports.UpdateAlertRuleDto = exports.CreateAlertRuleDto = exports.CountQueryDto = exports.IngestCountDto = exports.HeartbeatDto = exports.UpdateRadarDto = exports.CreateRadarDto = exports.UpdateUserDto = exports.AddUserDto = exports.UpdateBranchDto = exports.CreateBranchDto = exports.UpdateCompanyDto = exports.CreateCompanyDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateCompanyDto {
}
exports.CreateCompanyDto = CreateCompanyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Horus Retail S.A.S.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '900123456-7' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "nit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'horus_retail' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "dbName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['starter', 'pro', 'enterprise'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['starter', 'pro', 'enterprise']),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'contacto@empresa.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "contacto_email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://cdn.horus.co/logo.png' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "logo_url", void 0);
class UpdateCompanyDto {
}
exports.UpdateCompanyDto = UpdateCompanyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Horus Retail S.A.S.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['active', 'suspended'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'suspended']),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['starter', 'pro', 'enterprise'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['starter', 'pro', 'enterprise']),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'contacto@empresa.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "contacto_email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://cdn.horus.co/logo.png' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "logo_url", void 0);
class CreateBranchDto {
}
exports.CreateBranchDto = CreateBranchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sede Principal' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Medellín' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "ciudad", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cra 43A # 1-50' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "direccion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'America/Bogota' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "timezone", void 0);
class UpdateBranchDto {
}
exports.UpdateBranchDto = UpdateBranchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sede Principal' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBranchDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Medellín' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBranchDto.prototype, "ciudad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Cra 43A # 1-50' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBranchDto.prototype, "direccion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'America/Bogota' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBranchDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateBranchDto.prototype, "active", void 0);
class AddUserDto {
}
exports.AddUserDto = AddUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'usuario@empresa.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AddUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['super_admin', 'admin', 'manager', 'viewer'] }),
    (0, class_validator_1.IsIn)(['super_admin', 'admin', 'manager', 'viewer']),
    __metadata("design:type", String)
], AddUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [Number], example: [0, 1] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], AddUserDto.prototype, "branchIndexes", void 0);
class UpdateUserDto {
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['super_admin', 'admin', 'manager', 'viewer'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['super_admin', 'admin', 'manager', 'viewer']),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [Number], example: [0] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], UpdateUserDto.prototype, "branchIndexes", void 0);
class CreateRadarDto {
}
exports.CreateRadarDto = CreateRadarDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ESP32-AA11BB22' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRadarDto.prototype, "uid_hardware", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '665f1a2b3c4d5e6f7a8b9c0d' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRadarDto.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, minimum: 0 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateRadarDto.prototype, "branchIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Entrada Principal' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRadarDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '192.168.1.50' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRadarDto.prototype, "ip_local", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 80, minimum: 1, maximum: 65535 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateRadarDto.prototype, "local_api_port", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1.2.0' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRadarDto.prototype, "firmware_version", void 0);
class UpdateRadarDto {
}
exports.UpdateRadarDto = UpdateRadarDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Entrada Principal' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRadarDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '192.168.1.50' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRadarDto.prototype, "ip_local", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 80, minimum: 1, maximum: 65535 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateRadarDto.prototype, "local_api_port", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['active', 'inactive', 'error', 'offline'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'inactive', 'error', 'offline']),
    __metadata("design:type", String)
], UpdateRadarDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1.2.1' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRadarDto.prototype, "firmware_version", void 0);
class HeartbeatDto {
}
exports.HeartbeatDto = HeartbeatDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ESP32-AA11BB22' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HeartbeatDto.prototype, "uid_hardware", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '192.168.1.50' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HeartbeatDto.prototype, "ip_local", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1.2.0' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HeartbeatDto.prototype, "firmware_version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 80, minimum: 1, maximum: 65535 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], HeartbeatDto.prototype, "local_api_port", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: -58 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], HeartbeatDto.prototype, "wifi_rssi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 145000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], HeartbeatDto.prototype, "heap_free", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 86400 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], HeartbeatDto.prototype, "uptime_s", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 342 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], HeartbeatDto.prototype, "detections_total", void 0);
class IngestCountDto {
}
exports.IngestCountDto = IngestCountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ESP32-AA11BB22' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IngestCountDto.prototype, "uid_hardware", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-24T15:00:00.000Z' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IngestCountDto.prototype, "timestamp_utc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, minimum: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], IngestCountDto.prototype, "count_in", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 8, minimum: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], IngestCountDto.prototype, "count_out", void 0);
class CountQueryDto {
}
exports.CountQueryDto = CountQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '665f1a2b3c4d5e6f7a8b9c0d' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CountQueryDto.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CountQueryDto.prototype, "branchIndex", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '665f1a2b3c4d5e6f7a8b9c0e' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CountQueryDto.prototype, "radarId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-01T00:00:00.000Z' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CountQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-24T23:59:59.999Z' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CountQueryDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['hour', 'day', 'week', 'month'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['hour', 'day', 'week', 'month']),
    __metadata("design:type", String)
], CountQueryDto.prototype, "granularity", void 0);
class CreateAlertRuleDto {
}
exports.CreateAlertRuleDto = CreateAlertRuleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '665f1a2b3c4d5e6f7a8b9c0d' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertRuleDto.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateAlertRuleDto.prototype, "branchIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Aforo máximo sede principal' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertRuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['max_occupancy', 'radar_offline'] }),
    (0, class_validator_1.IsIn)(['max_occupancy', 'radar_offline']),
    __metadata("design:type", String)
], CreateAlertRuleDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100, minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateAlertRuleDto.prototype, "threshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 15, minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateAlertRuleDto.prototype, "offline_minutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAlertRuleDto.prototype, "notify_email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], example: ['admin@empresa.com'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { each: true }),
    __metadata("design:type", Array)
], CreateAlertRuleDto.prototype, "email_recipients", void 0);
class UpdateAlertRuleDto {
}
exports.UpdateAlertRuleDto = UpdateAlertRuleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Aforo máximo actualizado' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAlertRuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 120, minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateAlertRuleDto.prototype, "threshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20, minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateAlertRuleDto.prototype, "offline_minutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAlertRuleDto.prototype, "notify_email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { each: true }),
    __metadata("design:type", Array)
], UpdateAlertRuleDto.prototype, "email_recipients", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAlertRuleDto.prototype, "active", void 0);
class RequestOtpDto {
}
exports.RequestOtpDto = RequestOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com' }),
    __metadata("design:type", String)
], RequestOtpDto.prototype, "email", void 0);
class VerifyOtpDto {
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "code", void 0);
//# sourceMappingURL=index.js.map