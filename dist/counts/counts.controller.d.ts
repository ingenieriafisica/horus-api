import { CountsService } from './counts.service';
import { IngestCountDto, CountQueryDto } from '../common/dto';
export declare class CountsController {
    private readonly svc;
    constructor(svc: CountsService);
    ingest(dto: IngestCountDto): Promise<{
        ok: boolean;
    }>;
    query(dto: CountQueryDto): Promise<{
        data: {
            timestamp: string;
            count_in: any;
            count_out: any;
        }[];
        metadata: {
            total: any;
            period: "hour" | "day" | "week" | "month";
        };
        from: string;
        to: string;
        granularity: "hour" | "day" | "week" | "month";
    }>;
    kpis(companyId: string, branchIndex?: string): Promise<{
        today: any;
        month: any;
        year: any;
        peakHour: {
            hour: any;
            total_in: any;
        };
        generatedAt: Date;
    }>;
    compare(companyId: string, from: string, to: string, branchIndex?: string): Promise<{
        current: any;
        previous: any;
        change_pct: {
            in: number;
            out: number;
        };
    }>;
    compareByBranch(companyId: string, from: string, to: string): Promise<any[]>;
}
