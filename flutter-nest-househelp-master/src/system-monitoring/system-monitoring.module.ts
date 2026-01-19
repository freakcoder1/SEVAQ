import { Module } from '@nestjs/common';
import { SystemMonitoringService } from './system-monitoring.service';
import { SystemMonitoringController } from './system-monitoring.controller';

@Module({
  providers: [SystemMonitoringService],
  controllers: [SystemMonitoringController],
  exports: [SystemMonitoringService],
})
export class SystemMonitoringModule {}