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
    // In a real implementation, you would query all workers from the repository
    // For now, we'll create dummy worker metrics for demonstration purposes
    const dummyWorkers: WorkerMetrics[] = [
      {
        workerId: 1,
        totalAssignments: 150,
        successRate: 95.3,
        averageRating: 4.8,
        averageAssignmentTime: 245,
        utilizationRate: 87.5,
        totalEarnings: 4500
      },
      {
        workerId: 2,
        totalAssignments: 120,
        successRate: 92.5,
        averageRating: 4.6,
        averageAssignmentTime: 270,
        utilizationRate: 78.3,
        totalEarnings: 3800
      },
      {
        workerId: 3,
        totalAssignments: 95,
        successRate: 89.2,
        averageRating: 4.4,
        averageAssignmentTime: 300,
        utilizationRate: 65.8,
        totalEarnings: 3200
      }
    ];
    
    // Sort by success rate and return top 5
    return dummyWorkers
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
  }

  async getRealTimeMetrics(): Promise<DashboardMetrics> {
    return this.getDashboardMetrics();
  }
}