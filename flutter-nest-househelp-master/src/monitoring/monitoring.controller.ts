import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MonitoringService } from './monitoring.service';

@Controller('admin/monitoring')
@UseGuards(JwtAuthGuard)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('workers/locations')
  async getWorkerLocations() {
    return this.monitoringService.getWorkerLocations();
  }

  @Get('bookings/active')
  async getActiveBookings() {
    return this.monitoringService.getActiveBookings();
  }

  @Get('bookings/timeline')
  async getBookingTimeline() {
    return this.monitoringService.getBookingTimeline();
  }
}