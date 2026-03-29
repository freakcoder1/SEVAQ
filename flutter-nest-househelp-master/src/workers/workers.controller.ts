import { Controller, Get, Param, Query, Post, Body, Request, UseGuards, Patch, Logger } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workers')
export class WorkersController {
  private readonly logger = new Logger(WorkersController.name);
  
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  findAll(
    @Query('lat') lat?: number,
    @Query('long') long?: number,
    @Query('radius') radius?: number,
  ) {
    if (lat && long && radius) {
      return this.workersService.search(lat, long, radius);
    }
    return this.workersService.findAll();
  }

  @Post()
  create(@Body() createWorkerDto: CreateWorkerDto) {
    return this.workersService.create(
      createWorkerDto.userId,
      createWorkerDto.bio,
      createWorkerDto.serviceIds,
      createWorkerDto.latitude,
      createWorkerDto.longitude,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.workersService.findOne(id);
  }

  @Get('service/:serviceId')
  async findByService(@Param('serviceId') serviceId: string) {
    return this.workersService.findByService(serviceId);
  }

  // ============================================
  // NEW: Worker-specific endpoints for Worker App
  // ============================================

  /**
   * Get current worker's profile (from JWT token)
   * GET /workers/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req) {
    try {
      const worker = await this.workersService.findByUserId(req.user.userId);
      if (!worker) {
        return { message: 'Worker profile not found', worker: null };
      }
      return worker;
    } catch (error) {
      this.logger.error(`Error fetching worker profile: ${error.message}`, error.stack);
      return { message: 'Error fetching worker profile', error: error.message, worker: null };
    }
  }

  /**
   * Get current worker's bookings
   * GET /workers/me/bookings
   */
  @Get('me/bookings')
  @UseGuards(JwtAuthGuard)
  async getMyBookings(@Request() req, @Query('status') status?: string) {
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      return [];
    }
    return this.workersService.getWorkerBookings(worker.id, status);
  }

  /**
   * Get current worker's earnings summary
   * GET /workers/me/earnings
   */
  @Get('me/earnings')
  @UseGuards(JwtAuthGuard)
  async getMyEarnings(@Request() req) {
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      return { totalEarnings: 0, completedJobs: 0, pendingPayments: 0, thisMonth: 0, lastMonth: 0 };
    }
    return this.workersService.getWorkerEarnings(worker.id);
  }

  /**
   * Accept a booking
   * POST /workers/bookings/:id/accept
   */
  @Post('bookings/:id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptBooking(@Request() req, @Param('id') id: string) {
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      throw new Error('Worker profile not found');
    }
    return this.workersService.acceptBooking(id, worker.id);
  }

  /**
   * Reject a booking
   * POST /workers/bookings/:id/reject
   */
  @Post('bookings/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectBooking(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      throw new Error('Worker profile not found');
    }
    return this.workersService.rejectBooking(id, worker.id, reason);
  }

  /**
   * Start a job (mark as in progress)
   * POST /workers/bookings/:id/start
   */
  @Post('bookings/:id/start')
  @UseGuards(JwtAuthGuard)
  async startBooking(@Request() req, @Param('id') id: string) {
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      throw new Error('Worker profile not found');
    }
    return this.workersService.startBooking(id, worker.id);
  }

  /**
   * Complete a job
   * POST /workers/bookings/:id/complete
   */
  @Post('bookings/:id/complete')
  @UseGuards(JwtAuthGuard)
  async completeBooking(@Request() req, @Param('id') id: string) {
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      throw new Error('Worker profile not found');
    }
    return this.workersService.completeBooking(id, worker.id);
  }

  /**
   * Update worker availability
   * PATCH /workers/me/availability
   */
  @Patch('me/availability')
  @UseGuards(JwtAuthGuard)
  async updateMyAvailability(@Request() req, @Body('isAvailable') isAvailable: boolean) {
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      throw new Error('Worker profile not found');
    }
    return this.workersService.updateWorkerAvailability(worker.id, isAvailable);
  }

  /**
   * Update worker profile details
   * PATCH /workers/me
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(@Request() req, @Body() updateData: any) {
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      throw new Error('Worker profile not found');
    }
    return this.workersService.updateWorkerProfile(worker.id, updateData);
  }

  /**
   * Update worker's service categories
   * PATCH /workers/me/services
   */
  @Patch('me/services')
  @UseGuards(JwtAuthGuard)
  async updateMyServices(@Request() req, @Body('serviceCategories') serviceCategories: string[]) {
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      throw new Error('Worker profile not found');
    }
    return this.workersService.updateWorkerServices(worker.id, serviceCategories);
  }

  /**
   * Update worker's service area
   * PATCH /workers/me/service-area
   */
  @Patch('me/service-area')
  @UseGuards(JwtAuthGuard)
  async updateMyServiceArea(
    @Request() req,
    @Body() serviceArea: { latitude: number; longitude: number; address: string; radiusKm?: number },
  ) {
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      throw new Error('Worker profile not found');
    }
    return this.workersService.updateWorkerServiceArea(worker.id, serviceArea);
  }
}
