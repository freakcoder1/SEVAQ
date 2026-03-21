import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';

@Module({
  imports: [TerminusModule, TypeOrmModule.forFeature([Worker, Service])],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
