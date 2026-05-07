import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { CompaniesService } from '../companies/companies.service';
import { RequestOtpDto, VerifyOtpDto } from '../common/dto';
export declare class AuthService {
    private readonly jwtService;
    private readonly companiesService;
    private readonly redis;
    constructor(jwtService: JwtService, companiesService: CompaniesService, redis: Redis);
    requestOtp(dto: RequestOtpDto): Promise<{
        message: string;
        expiresIn: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: object;
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
    }>;
    logout(email: string): Promise<{
        message: string;
    }>;
    private generateOtp;
}
