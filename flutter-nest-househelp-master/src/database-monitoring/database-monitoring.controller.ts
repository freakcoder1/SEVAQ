import { Controller, Get, UseGuards } from '@nestjs/common';
import { DatabaseMonitoringService } from './database-monitoring.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('database-monitoring')
@UseGuards(AdminGuard)
export class DatabaseMonitoringController {
  constructor(
    private readonly databaseMonitoringService: DatabaseMonitoringService,
  ) {}

  @Get('metrics')
  async getMetrics() {
    return this.databaseMonitoringService.getMetrics();
  }
}
