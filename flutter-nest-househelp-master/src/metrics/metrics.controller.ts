import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  MetricsService,
  AssignmentMetrics,
  WorkerMetrics,
  SystemMetrics,
} from './metrics.service';
import { AdminGuard } from '../auth/admin.guard';
import { MetricsQueryDto } from './dto/metrics-query.dto';

@Controller('metrics')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AdminGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('assignments')
  async getAssignmentMetrics(
    @Query() query: MetricsQueryDto,
  ): Promise<AssignmentMetrics> {
    const timeRange = query.timeRange || 'day';
    return this.metricsService.getAssignmentMetrics(timeRange);
  }

  @Get('workers/:workerId')
  async getWorkerMetrics(
    @Param('workerId') workerId: number,
  ): Promise<WorkerMetrics> {
    return this.metricsService.getWorkerMetrics(workerId);
  }

  @Get('system')
  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.metricsService.getSystemMetrics();
  }

  @Get('assignments/service-types')
  async getMetricsByServiceType(
    @Query() query: MetricsQueryDto,
  ): Promise<any[]> {
    const timeRange = query.timeRange || 'day';
    return this.metricsService.getMetricsByServiceType(timeRange);
  }

  @Get('assignments/locations')
  async getMetricsByLocation(@Query() query: MetricsQueryDto): Promise<any[]> {
    const timeRange = query.timeRange || 'day';
    return this.metricsService.getMetricsByLocation(timeRange);
  }
}
