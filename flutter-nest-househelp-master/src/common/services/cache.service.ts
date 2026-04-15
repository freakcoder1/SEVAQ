import { Injectable, Logger } from '@nestjs/common';

/**
 * Cache Service
 * 
 * Multi-layer caching with automatic invalidation
 * Provides TTL based in-memory caching with namespace support
 * 
 * Can be extended with Redis for distributed caching
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  private readonly cache = new Map<string, {
    value: any;
    expiresAt: number;
    tags: string[];
  }>();

  private readonly DEFAULT_TTL = 300000; // 5 minutes

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache with optional TTL and tags
   */
  set<T>(key: string, value: T, ttl?: number, tags?: string[]): void {
    const effectiveTtl = ttl ?? this.DEFAULT_TTL;

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + effectiveTtl,
      tags: tags ?? [],
    });
  }

  /**
   * Get cached value or execute factory and cache result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
    tags?: string[]
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl, tags);
    return value;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries with given tag
   */
  invalidateTag(tag: string): void {
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger.debug(`Invalidated ${count} cache entries for tag: ${tag}`);
    }
  }

  /**
   * Invalidate multiple tags
   */
  invalidateTags(tags: string[]): void {
    tags.forEach(tag => this.invalidateTag(tag));
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.logger.log('Cache cleared completely');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }
}
