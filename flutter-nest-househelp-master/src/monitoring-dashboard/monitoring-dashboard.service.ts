import { Injectable, Logger } from '@nestjs/common';
import { HealthService } from '../health/health.service';
import { DatabaseMonitoringService } from '../database-monitoring/database-monitoring.service';
import { MetricsService } from '../metrics/metrics.service';
import { AlertsService } from '../alerts/alerts.service';
import { SystemMetrics, AssignmentMetrics, WorkerMetrics } from '../metrics/metrics.service';
import { Alert, AlertRule } from '../alerts/alerts.service';

export interface DashboardMetrics {
  system: SystemMetrics;
  database: {
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    slowQueries: number;
  };
  application: {
    assignmentMetrics: AssignmentMetrics;
    workerMetrics: WorkerMetrics[];
  };
  alerts: {
    activeAlerts: Alert[];
    alertRules: AlertRule[];
  };
  timestamp: Date;
}

@Injectable()
export class MonitoringDashboardService {
  private readonly logger = new Logger(MonitoringDashboardService.name);

  constructor(
    private readonly healthService: HealthService,
    private readonly databaseMonitoringService: DatabaseMonitoringService,
    private readonly metricsService: MetricsService,
    private readonly alertsService: AlertsService,
  ) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Get system metrics
      const systemMetrics = await this.metricsService.getSystemMetrics();

      // Get database metrics
      const databaseMetrics = await this.databaseMonitoringService.getMetrics();

      // Get application metrics
      const assignmentMetrics = await this.metricsService.getAssignmentMetrics('day');
      const workerMetrics = await this.getTopWorkerMetrics();

      // Get alerts
      const activeAlerts = this.alertsService.getActiveAlerts();
      const alertRules = this.alertsService.getAlertRules();

      return {
        system: systemMetrics,
        database: {
          activeConnections: databaseMetrics.activeConnections,
          idleConnections: databaseMetrics.idleConnections,
          totalConnections: databaseMetrics.totalConnections,
          slowQueries: databaseMetrics.slowQueries,
        },
        application: {
          assignmentMetrics,
          workerMetrics,
        },
        alerts: {
          activeAlerts,
          alertRules,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard metrics: ${error.message}`);
      throw error;
    }
  }

  async getSystemHealth(): Promise<any> {
    return this.healthService.check();
  }

  async getDatabaseHealth(): Promise<any> {
    return this.healthService.checkDatabase();
  }

  async getMemoryHealth(): Promise<any> {
    return this.healthService.checkMemory();
  }

  async getDiskHealth(): Promise<any> {
    return this.healthService.checkDisk();
  }

  private async getTopWorkerMetrics(): Promise<WorkerMetrics[]> {
    // Get all workers from the repository
    const workerMetrics = await this.metricsService.getWorkerMetrics('all');
    
    // Since getWorkerMetrics returns a single WorkerMetrics object, we need to get all workers
    // This is a simplified approach - in a real implementation, you would query all workers
    const allWorkers: WorkerMetrics[] = [workerMetrics];
    
    // Sort by success rate and return top 5
    return allWorkers
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
  }

  async getRealTimeMetrics(): Promise<DashboardMetrics> {
    return this.getDashboardMetrics();
  }
}