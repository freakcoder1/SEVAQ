import { Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  HealthIndicator,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    @InjectRepository(Worker)
    private workerRepository: Repository<Worker>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  async check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB heap threshold
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB RSS threshold
      () => this.checkWorkers(),
      () => this.checkServices(),
    ]);
  }

  async checkDatabase() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  async checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  async checkDisk() {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', {
          path: 'C:\\',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  private async checkWorkers(): Promise<HealthIndicatorResult> {
    try {
      const count = await this.workerRepository.count({
        where: { isActive: true },
      });

      const isHealthy = count > 0;
      return {
        workers: {
          status: isHealthy ? 'up' : 'down',
          activeWorkers: count,
        },
      };
    } catch (error) {
      return {
        workers: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }

  private async checkServices(): Promise<HealthIndicatorResult> {
    try {
      const count = await this.serviceRepository.count();

      const isHealthy = count > 0;
      return {
        services: {
          status: isHealthy ? 'up' : 'down',
          totalServices: count,
        },
      };
    } catch (error) {
      return {
        services: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }
}
