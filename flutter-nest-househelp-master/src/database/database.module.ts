import { Module } from '@nestjs/common';
import { DatabaseCacheService } from './cache.service';

@Module({
  providers: [DatabaseCacheService],
  exports: [DatabaseCacheService],
})
export class DatabaseModule {}
