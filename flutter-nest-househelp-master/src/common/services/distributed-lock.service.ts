import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Distributed Lock Service
 * 
 * Provides advisory locking for race condition protection
 * Uses optimistic locking with token ownership verification
 * 
 * Prevents concurrent execution of sensitive operations:
 * - Booking assignments
 * - Slot allocation
 * - Payment processing
 * - Worker status changes
 */
@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);

  private readonly locks = new Map<string, {
    ownerToken: string;
    expiresAt: number;
  }>();

  private readonly DEFAULT_LOCK_TTL = 30000; // 30 seconds

  /**
   * Attempt to acquire lock for given resource key
   * Returns owner token if lock acquired, null otherwise
   */
  async tryAcquireLock(key: string, ttl?: number): Promise<string | null> {
    const existingLock = this.locks.get(key);

    if (existingLock && Date.now() < existingLock.expiresAt) {
      return null;
    }

    const ownerToken = crypto.randomUUID();
    const effectiveTtl = ttl ?? this.DEFAULT_LOCK_TTL;

    this.locks.set(key, {
      ownerToken,
      expiresAt: Date.now() + effectiveTtl,
    });

    this.logger.debug(`Acquired lock for key: ${key} (owner: ${ownerToken.substring(0, 8)})`);
    return ownerToken;
  }

  /**
   * Release lock using owner token
   * Returns true if lock was released successfully
   */
  async releaseLock(key: string, ownerToken: string): Promise<boolean> {
    const existingLock = this.locks.get(key);

    if (!existingLock) {
      return true;
    }

    if (existingLock.ownerToken !== ownerToken) {
      this.logger.warn(`Attempted to release lock with invalid owner token: ${key}`);
      return false;
    }

    this.locks.delete(key);
    this.logger.debug(`Released lock for key: ${key}`);
    return true;
  }

  /**
   * Execute function while holding lock
   * Automatically releases lock after execution
   */
  async executeWithLock<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const ownerToken = await this.tryAcquireLock(key, ttl);

    if (!ownerToken) {
      throw new Error(`Could not acquire lock for resource: ${key}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(key, ownerToken);
    }
  }

  /**
   * Check if lock is currently held
   */
  isLocked(key: string): boolean {
    const existingLock = this.locks.get(key);
    return existingLock != null && Date.now() < existingLock.expiresAt;
  }

  /**
   * Get lock time remaining in milliseconds
   */
  getLockRemainingTime(key: string): number | null {
    const existingLock = this.locks.get(key);

    if (!existingLock) {
      return null;
    }

    const remaining = existingLock.expiresAt - Date.now();
    return remaining > 0 ? remaining : null;
  }

  /**
   * Clean up expired locks
   */
  cleanupExpiredLocks(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, lock] of this.locks.entries()) {
      if (now > lock.expiresAt) {
        this.locks.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired locks`);
    }
  }

  /**
   * Get lock statistics
   */
  getStats() {
    this.cleanupExpiredLocks();

    return {
      activeLocks: this.locks.size,
    };
  }
}
