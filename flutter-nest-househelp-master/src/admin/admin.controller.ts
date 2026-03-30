import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { BookingStatus } from '../bookings/entities/booking.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================
  // Dashboard Statistics
  // ============================================

  /**
   * Get comprehensive dashboard statistics
   * GET /admin/dashboard
   */
  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ============================================
  // Worker Management
  // ============================================

  /**
   * Get all workers with optional filters
   * GET /admin/workers
   */
  @Get('workers')
  async getAllWorkers(
    @Query('isAvailable') isAvailable?: string,
    @Query('minRating') minRating?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.adminService.getAllWorkers({
      isAvailable: isAvailable === 'true',
      minRating: minRating ? parseFloat(minRating) : undefined,
      serviceId,
    });
  }

  /**
   * Get worker by ID
   * GET /admin/workers/:id
   */
  @Get('workers/:id')
  async getWorkerById(@Param('id') id: string) {
    return this.adminService.getWorkerById(parseInt(id, 10));
  }

  /**
   * Update worker details
   * PUT /admin/workers/:id
   */
  @Put('workers/:id')
  async updateWorker(
    @Param('id') id: string,
    @Body() updates: { bio?: string; rating?: number; isAvailable?: boolean },
  ) {
    return this.adminService.updateWorker(parseInt(id, 10), updates);
  }

  /**
   * Toggle worker availability
   * PATCH /admin/workers/:id/availability
   */
  @Patch('workers/:id/availability')
  async toggleWorkerAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.adminService.toggleWorkerAvailability(parseInt(id, 10), isAvailable);
  }

  // ============================================
  // Booking Management
  // ============================================

  /**
   * Get all bookings with optional filters
   * GET /admin/bookings
   */
  @Get('bookings')
  async getAllBookings(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('workerId') workerId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getAllBookings({
      status: status as BookingStatus,
      startDate,
      endDate,
      workerId: workerId ? parseInt(workerId, 10) : undefined,
      userId,
    });
  }

  /**
   * Get booking by ID
   * GET /admin/bookings/:id
   */
  @Get('bookings/:id')
  async getBookingById(@Param('id') id: string) {
    return this.adminService.getBookingById(id);
  }

  /**
   * Update booking status
   * PATCH /admin/bookings/:id/status
   */
  @Patch('bookings/:id/status')
  async updateBookingStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.adminService.updateBookingStatus(id, status);
  }

  /**
   * Cancel a booking
   * POST /admin/bookings/:id/cancel
   */
  @Post('bookings/:id/cancel')
  async cancelBooking(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.cancelBooking(id, reason);
  }

  // ============================================
  // Analytics
  // ============================================

  /**
   * Get revenue analytics
   * GET /admin/analytics/revenue
   */
  @Get('analytics/revenue')
  async getRevenueAnalytics(@Query('period') period?: 'day' | 'week' | 'month' | 'year') {
    return this.adminService.getRevenueAnalytics(period);
  }

  /**
   * Get booking analytics
   * GET /admin/analytics/bookings
   */
  @Get('analytics/bookings')
  async getBookingAnalytics() {
    return this.adminService.getBookingAnalytics();
  }

  // ============================================
  // User Management
  // ============================================

  /**
   * Get all users
   * GET /admin/users
   */
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  /**
   * Get user by ID
   * GET /admin/users/:id
   */
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  // ============================================
  // Worker Profile Management
  // ============================================

  /**
   * Create worker profile for existing user
   * POST /admin/workers/by-email
   */
  @Post('workers/by-email')
  async createWorkerProfileByEmail(@Body() body: { email: string; bio?: string; serviceIds?: string[]; latitude?: number; longitude?: number }) {
    return this.adminService.createWorkerProfileForUser(
      body.email,
      body.bio || '',
      body.serviceIds || [],
      body.latitude || 28.5804579,
      body.longitude || 77.4392951,
    );
  }
}