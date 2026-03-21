import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { SystemPerformanceMetric } from '../metrics/entities/metric.entity';
import { MetricsModule } from '../metrics/metrics.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemPerformanceMetric]),
    MetricsModule,
    NotificationsModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
