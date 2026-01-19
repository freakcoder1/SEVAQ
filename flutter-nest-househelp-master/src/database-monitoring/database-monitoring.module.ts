import { Module } from '@nestjs/common';
import { DatabaseMonitoringService } from './database-monitoring.service';
import { DatabaseMonitoringController } from './database-monitoring.controller';
import { DatabaseMonitoringInterceptor } from './database-monitoring.interceptor';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { makeGaugeProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [PrometheusModule],
  controllers: [DatabaseMonitoringController],
  providers: [
    DatabaseMonitoringService,
    DatabaseMonitoringInterceptor,
    makeGaugeProvider({
      name: 'database_active_connections',
      help: 'Number of active database connections',
    }),
    makeGaugeProvider({
      name: 'database_idle_connections',
      help: 'Number of idle database connections',
    }),
    makeGaugeProvider({
      name: 'database_total_connections',
      help: 'Total number of database connections',
    }),
    makeHistogramProvider({
      name: 'database_query_execution_time_seconds',
      help: 'Database query execution time in seconds',
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
    }),
    makeGaugeProvider({
      name: 'database_slow_queries_total',
      help: 'Number of slow database queries',
    }),
  ],
  exports: [DatabaseMonitoringService, DatabaseMonitoringInterceptor],
})
export class DatabaseMonitoringModule {}