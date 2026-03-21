import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import NodeCache from 'node-cache';

@Injectable()
export class DatabaseCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseCacheService.name);
  private cache: NodeCache;
  private queryRunner: QueryRunner;

  constructor(private readonly dataSource: DataSource) {
    this.cache = new NodeCache({
      stdTTL: 60, // 60 seconds default TTL
      checkperiod: 120, // Check for expired items every 120 seconds
      useClones: false, // Don't clone objects (better performance)
    });
  }

  async onModuleInit() {
    this.logger.log('DatabaseCacheService initialized');
    this.queryRunner = this.dataSource.createQueryRunner();
  }

  async onModuleDestroy() {
    if (this.queryRunner) {
      await this.queryRunner.release();
    }
  }

  // Cache a query result
  async cacheQuery(
    key: string,
    query: string,
    parameters?: any[],
  ): Promise<any> {
    // Check cache first
    const cachedResult = this.cache.get(key);
    if (cachedResult) {
      this.logger.debug(`Cache hit for query: ${key}`);
      return cachedResult;
    }

    this.logger.debug(`Cache miss for query: ${key}, executing database query`);

    try {
      const result = await this.queryRunner.manager.query(query, parameters);

      // Cache the result
      this.cache.set(key, result);

      return result;
    } catch (error) {
      this.logger.error(`Error executing query ${key}: ${error.message}`);
      throw error;
    }
  }

  // Invalidate cache for a specific key
  invalidateCache(key: string): void {
    this.cache.del(key);
    this.logger.debug(`Invalidated cache for key: ${key}`);
  }

  // Clear all cache
  clearCache(): void {
    this.cache.flushAll();
    this.logger.log('Cleared all database cache');
  }

  // Get cache statistics
  getCacheStats(): { keys: number; hits: number; misses: number } {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
    };
  }

  // Cache schema information to avoid repeated schema queries
  async cacheSchemaInfo(tableName: string): Promise<any> {
    const cacheKey = `schema:${tableName}`;

    const cachedSchema = this.cache.get(cacheKey);
    if (cachedSchema) {
      return cachedSchema;
    }

    // Query schema information
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
    `;

    const result = await this.queryRunner.manager.query(schemaQuery, [
      tableName,
    ]);

    // Cache for longer period since schema doesn't change often
    this.cache.set(cacheKey, result, 3600); // 1 hour TTL

    return result;
  }
}
