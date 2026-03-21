import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseMonitoringService } from './database-monitoring.service';

@Injectable()
export class TypeOrmMonitoringInterceptor implements OnModuleInit {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly databaseMonitoringService: DatabaseMonitoringService,
  ) {}

  onModuleInit() {
    this.setupMonitoring();
  }

  private setupMonitoring() {
    // Store the service reference in a way that can be accessed by the patched methods
    const monitoringService = this.databaseMonitoringService;

    // Override the query method to add monitoring
    const originalQuery = this.dataSource.query;
    this.dataSource.query = async function (
      this: DataSource,
      query: string,
      parameters?: any[],
    ) {
      const timer = monitoringService.startQueryTimer();
      try {
        const result = await originalQuery.call(this, query, parameters);
        timer.end();
        return result;
      } catch (error) {
        timer.end();
        throw error;
      }
    };

    // Also monitor entity manager queries
    const originalManagerQuery = DataSource.prototype.manager.query;
    DataSource.prototype.manager.query = async function (
      this: DataSource,
      query: string,
      parameters?: any[],
    ) {
      const timer = monitoringService.startQueryTimer();
      try {
        const result = await originalManagerQuery.call(this, query, parameters);
        timer.end();
        return result;
      } catch (error) {
        timer.end();
        throw error;
      }
    };
  }
}
