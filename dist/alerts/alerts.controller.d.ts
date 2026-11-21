import { AlertsService } from './alerts.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto } from '../common/dto';
export declare class AlertsController {
    private readonly svc;
    constructor(svc: AlertsService);
    findEvents(user: {
        companyId: string;
        role: string;
        branchIndexes: number[];
    }, companyId?: string, acknowledged?: string, limit?: number): Promise<import("./entities/alert-event.schema").AlertEventDocument[]>;
    acknowledge(id: string, user: {
        companyId: string;
        email: string;
        role: string;
    }): Promise<import("./entities/alert-event.schema").AlertEventDocument>;
    findRules(user: {
        companyId: string;
        role: string;
    }, companyId?: string): Promise<import("./entities/alert-rule.schema").AlertRuleDocument[]>;
    createRule(dto: CreateAlertRuleDto, user: {
        companyId: string;
        email: string;
        role: string;
    }): Promise<import("./entities/alert-rule.schema").AlertRuleDocument>;
    updateRule(id: string, dto: UpdateAlertRuleDto, user: {
        companyId: string;
        role: string;
    }): Promise<import("./entities/alert-rule.schema").AlertRuleDocument>;
    deleteRule(id: string, user: {
        companyId: string;
        role: string;
    }): Promise<{
        message: string;
    }>;
}
