import { Request } from 'express';
import { TokenBlacklistService } from './token-blacklist.service';
import { CompaniesService } from '../companies/companies.service';
export interface JwtPayload {
    sub: string;
    companyId: string;
    role: string;
    branchIndexes: number[];
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly blacklistService;
    private readonly companiesService;
    constructor(blacklistService: TokenBlacklistService, companiesService: CompaniesService);
    validate(req: Request, payload: JwtPayload): Promise<{
        email: string;
        companyId: string;
        role: string;
        branchIndexes: number[];
    }>;
}
export {};
