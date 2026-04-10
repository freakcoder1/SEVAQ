import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge, Histogram } from 'prom-client';

@Injectable()
export class DatabaseMonitoringService implements OnModuleInit {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectMetric('database_active_connections')
    public activeConnections: Gauge<string>,
    @InjectMetric('database_idle_connections')
    public idleConnections: Gauge<string>,
    @InjectMetric('database_total_connections')
    public totalConnections: Gauge<string>,
    @InjectMetric('database_query_execution_time_seconds')
    public queryExecutionTime: Histogram<string>,
    @InjectMetric('database_slow_queries_total')
    public slowQueries: Gauge<string>,
  ) {}

  onModuleInit() {
    // Start monitoring in background - DO NOT await!
    // Awaiting would block module initialization forever
    this.startMonitoring();
  }

  private async startMonitoring() {
    // Start monitoring connection pool metrics
    setInterval(async () => {
      await this.updateConnectionPoolMetrics();
    }, 5000); // Update every 5 seconds
  }

  private async updateConnectionPoolMetrics() {
    try {
      console.log('Updating database connection pool metrics...');
      const queryRunner = this.dataSource.createQueryRunner();

      // Get active connections
      const activeConnections = this.dataSource.queryResultCache
        ? Object.keys(this.dataSource.queryResultCache).length
        : 0;
      this.activeConnections.set(activeConnections);

      // Get idle connections (approximation)
      const idleConnections = Math.max(
        0,
        (this.dataSource.options.poolSize || 10) - activeConnections,
      );
      this.idleConnections.set(idleConnections);

      // Total connections
      this.totalConnections.set(activeConnections + idleConnections);

      console.log(
        `Database metrics updated: active=${activeConnections}, idle=${idleConnections}`,
      );
      await queryRunner.release();
    } catch (error) {
      console.error('Error updating connection pool metrics:', error);
    }
  }

  // Method to track query execution time
  public startQueryTimer() {
    const startTime = process.hrtime();
    return {
      end: () => {
        const diff = process.hrtime(startTime);
        const duration = diff[0] + diff[1] / 1e9;
        this.queryExecutionTime.observe(duration);

        // Track slow queries (threshold: 1 second)
        if (duration > 1) {
          this.slowQueries.inc();
        }
      },
    };
  }

  // Get metrics for Prometheus
  public async getMetrics() {
    const active = await this.activeConnections.get();
    const idle = await this.idleConnections.get();
    const total = await this.totalConnections.get();
    const slow = await this.slowQueries.get();
    return {
      activeConnections: active.values[0].value,
      idleConnections: idle.values[0].value,
      totalConnections: total.values[0].value,
      slowQueries: slow.values[0].value,
    };
  }
}
