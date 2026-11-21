import { Response } from 'express';
import { CountsService } from './counts.service';
import { IngestCountDto, CountQueryDto } from '../common/dto';
interface JwtUser {
    email: string;
    companyId: string;
    role: string;
    branchIndexes: number[];
}
export declare class CountsController {
    private readonly svc;
    constructor(svc: CountsService);
    ingest(dto: IngestCountDto, authHeader?: string): Promise<{
        ok: boolean;
    }>;
    query(dto: CountQueryDto, user: JwtUser): Promise<{
        series: any[];
        totals: any;
        from: string;
        to: string;
        granularity: "hour" | "day" | "week" | "month";
    }>;
    exportCsv(dto: CountQueryDto, user: JwtUser, res: Response): Promise<void>;
    kpis(companyId: string, user: JwtUser, branchIndex?: string, radarId?: string): Promise<any>;
    compare(companyId: string, from: string, to: string, user: JwtUser, branchIndex?: string, radarId?: string): Promise<{
        current: any;
        previous: any;
        change_pct: {
            in: number;
            out: number;
        };
    }>;
    compareByBranch(companyId: string, from: string, to: string, user: JwtUser): Promise<any[]>;
    byRadar(companyId: string, from: string, to: string, user: JwtUser, branchIndex?: string): Promise<any[]>;
    byCompany(from: string, to: string): Promise<any[]>;
    private allowedBranches;
}
export {};
