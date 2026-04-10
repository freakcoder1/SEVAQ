import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue-trend')
  async getRevenueTrend(@Query('days') days: string) {
    const numDays = parseInt(days, 10) || 30;
    return this.analyticsService.getRevenueTrend(numDays);
  }

  @Get('booking-trend')
  async getBookingTrend(@Query('days') days: string) {
    const numDays = parseInt(days, 10) || 30;
    return this.analyticsService.getBookingTrend(numDays);
  }

  @Get('service-popularity')
  async getServicePopularity() {
    return this.analyticsService.getServicePopularity();
  }

  @Get('worker-performance')
  async getWorkerPerformance() {
    return this.analyticsService.getWorkerPerformance();
  }

  @Get('customer-retention')
  async getCustomerRetention() {
    return this.analyticsService.getCustomerRetention();
  }

  @Get('geographic')
  async getGeographicDistribution() {
    return this.analyticsService.getGeographicDistribution();
  }
}
