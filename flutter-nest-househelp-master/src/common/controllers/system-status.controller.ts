import { Controller, Get } from '@nestjs/common';
import { ObservabilityService } from '../services/observability.service';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { CacheService } from '../services/cache.service';
import { AsyncWorkerPoolService } from '../services/async-worker-pool.service';

@Controller('api/system/status')
export class SystemStatusController {
  constructor(
    private readonly observabilityService: ObservabilityService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly cacheService: CacheService,
    private readonly workerPoolService: AsyncWorkerPoolService,
  ) {}

  @Get('health')
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        observability: 'online',
        circuitBreaker: 'online',
        cache: 'online',
        workerPool: 'online',
      },
    };
  }

  @Get('metrics')
  getMetrics() {
    return this.observabilityService.getHealthSummary();
  }

  @Get('circuit-breaker')
  getCircuitBreakerStatus() {
    return this.circuitBreakerService.getAllStatuses();
  }

  @Get('cache')
  getCacheStatus() {
    return this.cacheService.getStats();
  }

  @Get('worker-pool')
  getWorkerPoolStatus() {
    return this.workerPoolService.getStats();
  }

  @Get('full')
  getFullStatus() {
    return {
      health: this.getHealth(),
      metrics: this.getMetrics(),
      circuitBreaker: this.getCircuitBreakerStatus(),
      cache: this.getCacheStatus(),
      workerPool: this.getWorkerPoolStatus(),
    };
  }
}
