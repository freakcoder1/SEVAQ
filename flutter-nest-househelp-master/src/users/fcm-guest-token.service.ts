import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FcmGuestToken } from './entities/fcm-guest-token.entity';

/**
 * Service to store and retrieve FCM tokens for guest (unauthenticated) users.
 * When a guest later creates a booking, their deviceId maps to their FCM token
 * so the backend can send push notifications even before they log in.
 */
@Injectable()
export class FcmGuestTokenService {
  private readonly logger = new Logger(FcmGuestTokenService.name);
  private readonly tokenTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days cleanup window

  constructor(
    @InjectRepository(FcmGuestToken)
    private readonly repo: Repository<FcmGuestToken>,
  ) {}

  async storeToken(deviceId: string, token: string): Promise<void> {
    if (!deviceId || !token) return;

    this.logger.log(`storeToken: deviceId=$deviceId, token=${token.substring(0, 10)}...`);
    try {
      const existing = await this.repo.findOne({ where: { deviceId } });
      if (existing) {
        existing.token = token;
        existing.createdAt = new Date();
        await this.repo.save(existing);
        this.logger.debug(`Updated guest FCM token for device ${deviceId}`);
      } else {
        await this.repo.save(
          this.repo.create({ deviceId, token, createdAt: new Date() }),
        );
        this.logger.debug(`Stored new guest FCM token for device ${deviceId}`);
      }
    } catch (e) {
      this.logger.error(`storeToken FAILED: ${e instanceof Error ? e.message : String(e)}`);
      throw e;
    }
  }

  async getToken(deviceId: string): Promise<string | null> {
    if (!deviceId) return null;

    const record = await this.repo.findOne({ where: { deviceId } });
    if (!record) return null;

    // Lazily clean up stale tokens only if a record was found
    // (avoids unnecessary DB writes on every single read)
    if (Date.now() - record.createdAt.getTime() > this.tokenTtlMs) {
      await this.repo.delete({ deviceId });
      return null;
    }

    return record.token;
  }

  async deleteToken(deviceId: string): Promise<void> {
    await this.repo.delete({ deviceId });
  }

  /** Scheduled job: removes tokens older than 7 days. Call from a cron job. */
  async clearStaleTokens(): Promise<number> {
    const cutoff = new Date(Date.now() - this.tokenTtlMs);
    const stale = await this.repo
      .createQueryBuilder()
      .delete()
      .where(`"created_at" < :cutoff`, { cutoff })
      .execute();
    const count = stale.affected ?? 0;
    if (count > 0) {
      this.logger.log(`Cleaned ${count} stale guest FCM token(s)`);
    }
    return count;
  }

  async findAll(): Promise<FcmGuestToken[]> {
    return await this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
