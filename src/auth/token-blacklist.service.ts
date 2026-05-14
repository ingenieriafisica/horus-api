import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

const BLACKLIST_PREFIX = 'blacklist:';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Añade el token a la lista negra con TTL igual al tiempo restante
   * hasta su expiración natural, para no acumular entradas obsoletas.
   */
  async blacklist(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as { exp?: number } | null;
      if (!decoded?.exp) return;

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redis.setex(`${BLACKLIST_PREFIX}${token}`, ttl, '1');
        this.logger.debug(`Token en blacklist por ${ttl}s`);
      }
    } catch (error) {
      this.logger.warn('No se pudo añadir token a blacklist:', error);
    }
  }

  /** Devuelve true si el token está en la lista negra (sesión cerrada). */
  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(`${BLACKLIST_PREFIX}${token}`);
    return result !== null;
  }
}