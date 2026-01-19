import { Module } from '@nestjs/common';
import { MonitoringDashboardController } from './monitoring-dashboard.controller';
import { MonitoringDashboardService } from './monitoring-dashboard.service';
import { HealthModule } from '../health/health.module';
import { DatabaseMonitoringModule } from '../database-monitoring/database-monitoring.module';
import { MetricsModule } from '../metrics/metrics.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [HealthModule, DatabaseMonitoringModule, MetricsModule, AlertsModule],
  controllers: [MonitoringDashboardController],
  providers: [MonitoringDashboardService],
  exports: [MonitoringDashboardService],
})
export class MonitoringDashboardModule {}