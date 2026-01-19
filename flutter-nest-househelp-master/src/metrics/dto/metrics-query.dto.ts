import { IsOptional, IsIn } from 'class-validator';

export class MetricsQueryDto {
    @IsOptional()
    @IsIn(['hour', 'day', 'week', 'month'], { message: 'Time range must be one of: hour, day, week, month' })
    timeRange?: 'hour' | 'day' | 'week' | 'month';
}