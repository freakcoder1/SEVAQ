import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { AssignmentMetric } from './entities/metric.entity';
import { WorkerPerformanceMetric } from './entities/metric.entity';
import { UserBehaviorMetric } from './entities/metric.entity';
import { SystemPerformanceMetric } from './entities/metric.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Worker } from '../workers/entities/worker.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssignmentMetric,
      WorkerPerformanceMetric,
      UserBehaviorMetric,
      SystemPerformanceMetric,
      Booking,
      Worker,
      User,
    ]),
  ],
  providers: [MetricsService],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {}
