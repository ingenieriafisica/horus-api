import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
export declare class TokenBlacklistService {
    private readonly redis;
    private readonly jwtService;
    private readonly logger;
    constructor(redis: Redis, jwtService: JwtService);
    blacklist(token: string): Promise<void>;
    isBlacklisted(token: string): Promise<boolean>;
}
