import { Model } from 'mongoose';
import Redis from 'ioredis';
import { CountDocument } from './entities/count.schema';
import { RadarsService } from '../radars/radars.service';
import { AlertsService } from '../alerts/alerts.service';
import { IngestCountDto, CountQueryDto } from '../common/dto';
export declare class CountsService {
    private readonly countModel;
    private readonly radarsService;
    private readonly alertsService;
    private readonly redis;
    private readonly logger;
    constructor(countModel: Model<CountDocument>, radarsService: RadarsService, alertsService: AlertsService, redis: Redis);
    ingest(dto: IngestCountDto, bearerToken?: string): Promise<{
        ok: boolean;
    }>;
    query(dto: CountQueryDto, allowedBranches?: number[]): Promise<{
        series: any[];
        totals: any;
        from: string;
        to: string;
        granularity: "hour" | "day" | "week" | "month";
    }>;
    exportCsv(dto: CountQueryDto, allowedBranches?: number[]): Promise<string>;
    getKpis(companyId: string, branchIndex?: number, radarId?: string, allowedBranches?: number[]): Promise<any>;
    compare(companyId: string, from: string, to: string, branchIndex?: number, radarId?: string, allowedBranches?: number[]): Promise<{
        current: any;
        previous: any;
        change_pct: {
            in: number;
            out: number;
        };
    }>;
    compareByBranch(companyId: string, from: string, to: string, allowedBranches?: number[]): Promise<any[]>;
    byRadar(companyId: string, from: string, to: string, branchIndex?: number, allowedBranches?: number[]): Promise<any[]>;
    byCompany(from: string, to: string): Promise<any[]>;
    private applyBranchFilter;
    private endOfDay;
    private sumPeriod;
    private getPeakHour;
    private buildGroupId;
}
