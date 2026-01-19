import { Controller, Get } from '@nestjs/common';
import { SystemMonitoringService } from './system-monitoring.service';

@Controller('system-monitoring')
export class SystemMonitoringController {
  constructor(
    private readonly systemMonitoringService: SystemMonitoringService,
  ) {}

  @Get('metrics')
  async getMetrics(): Promise<string> {
    return this.systemMonitoringService.getMetrics();
  }

  @Get('cpu')
  async getCpuUsage() {
    return this.systemMonitoringService.getCpuUsage();
  }

  @Get('memory')
  async getMemoryUsage() {
    return this.systemMonitoringService.getMemoryUsage();
  }

  @Get('disk')
  async getDiskUsage() {
    return this.systemMonitoringService.getDiskUsage();
  }
}