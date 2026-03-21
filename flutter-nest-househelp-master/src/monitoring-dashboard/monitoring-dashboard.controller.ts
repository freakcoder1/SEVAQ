import { Controller, Get, UseGuards } from '@nestjs/common';
import { MonitoringDashboardService } from './monitoring-dashboard.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('monitoring-dashboard')
@UseGuards(AdminGuard)
export class MonitoringDashboardController {
  constructor(
    private readonly monitoringDashboardService: MonitoringDashboardService,
  ) {}

  @Get('metrics')
  async getDashboardMetrics() {
    return this.monitoringDashboardService.getDashboardMetrics();
  }
}
