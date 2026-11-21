import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Model } from 'mongoose';
import Redis from 'ioredis';
import { AlertRuleDocument } from './entities/alert-rule.schema';
import { AlertEventDocument } from './entities/alert-event.schema';
import { RadarDocument } from '../radars/entities/radar.schema';
import { CountDocument } from '../counts/entities/count.schema';
import { MailService } from '../auth/mail.service';
import { AuditService } from '../audit/audit.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto } from '../common/dto';
export declare class AlertsService implements OnModuleInit, OnModuleDestroy {
    private readonly ruleModel;
    private readonly eventModel;
    private readonly radarModel;
    private readonly countModel;
    private readonly mailService;
    private readonly auditService;
    private readonly redis;
    private readonly logger;
    private monitorTimer?;
    constructor(ruleModel: Model<AlertRuleDocument>, eventModel: Model<AlertEventDocument>, radarModel: Model<RadarDocument>, countModel: Model<CountDocument>, mailService: MailService, auditService: AuditService, redis: Redis);
    onModuleInit(): void;
    onModuleDestroy(): void;
    createRule(dto: CreateAlertRuleDto, actor?: {
        email?: string;
        role?: string;
    }): Promise<AlertRuleDocument>;
    findRules(companyId: string): Promise<AlertRuleDocument[]>;
    updateRule(id: string, companyId: string, dto: UpdateAlertRuleDto, role?: string): Promise<AlertRuleDocument>;
    deleteRule(id: string, companyId: string, role?: string): Promise<{
        message: string;
    }>;
    findEvents(companyId: string, acknowledged?: boolean, limit?: number, branchIndexes?: number[]): Promise<AlertEventDocument[]>;
    acknowledgeEvent(id: string, companyId: string, actor: {
        email: string;
        role: string;
    }): Promise<AlertEventDocument>;
    evaluateOccupancy(companyId: string, branchIndex: number, radarId: string): Promise<void>;
    checkOfflineRadars(): Promise<number>;
}
