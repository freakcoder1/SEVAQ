import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemReadinessController } from './system-readiness.controller';
import { SystemReadinessService } from './system-readiness.service';
import { SystemHealth } from './entities/system-health.entity';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemHealth, Worker, Service])],
  controllers: [SystemReadinessController],
  providers: [SystemReadinessService],
  exports: [SystemReadinessService],
})
export class SystemStatusModule {}
