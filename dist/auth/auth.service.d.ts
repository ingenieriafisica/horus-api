import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { CompaniesService } from '../companies/companies.service';
import { MailService } from './mail.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly jwtService;
    private readonly companiesService;
    private readonly mailService;
    private readonly blacklistService;
    private readonly redis;
    private readonly logger;
    constructor(jwtService: JwtService, companiesService: CompaniesService, mailService: MailService, blacklistService: TokenBlacklistService, redis: Redis);
    requestOtp(dto: RequestOtpDto): Promise<{
        message: string;
        expiresIn: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: {
            email: string;
            role: string;
            companyId: string;
            companyName: string;
            branchIndexes: number[];
        };
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
    }>;
    logout(accessToken: string, email: string): Promise<{
        message: string;
    }>;
    private generateOtp;
    private safeCompare;
}
