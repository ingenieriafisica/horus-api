import { Model } from 'mongoose';
import { CountDocument } from './entities/count.schema';
import { CamerasService } from '../cameras/cameras.service';
import { IngestCountDto, CountQueryDto } from '../common/dto';
export declare class CountsService {
    private readonly countModel;
    private readonly camerasService;
    constructor(countModel: Model<CountDocument>, camerasService: CamerasService);
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
    getKpis(companyId: string, branchIndex?: number): Promise<{
        today: any;
        month: any;
        year: any;
        peakHour: {
            hour: any;
            total_in: any;
        };
        generatedAt: Date;
    }>;
    compare(companyId: string, from: string, to: string, branchIndex?: number): Promise<{
        current: any;
        previous: any;
        change_pct: {
            in: number;
            out: number;
        };
    }>;
    compareByBranch(companyId: string, from: string, to: string): Promise<any[]>;
    private sumPeriod;
    private getPeakHour;
    private formatBucket;
    private buildGroupId;
}
