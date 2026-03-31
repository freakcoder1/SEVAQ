import { Controller, Get, Param, Query, Post, Body, Request, UseGuards, Patch, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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
      console.log('[WorkersController] getMyProfile - user:', req.user);
      
      // Safe check - if no user object from auth guard
      if (!req.user || !req.user.userId) {
        console.error('[WorkersController] No user in request - auth guard may have failed');
        return { 
          message: 'Authentication required',
          needsRegistration: false 
        };
      }
      
      const worker = await this.workersService.findByUserId(req.user.userId);
      console.log('[WorkersController] findByUserId result:', worker ? 'found' : 'not found');
      if (!worker) {
        // Return a 200 response with null worker instead of error
        // This indicates the user hasn't created a worker profile yet
        return { 
          message: 'Worker profile not found. Please complete your worker registration.', 
          worker: null,
          needsRegistration: true 
        };
      }
      return worker;
    } catch (error) {
      this.logger.error(`Error fetching worker profile: ${error.message}`, error.stack);
      console.error('[WorkersController] getMyProfile error:', error);
      // Return 200 with error info for debugging
      return { 
        message: 'Error fetching worker profile', 
        error: error.message, 
        worker: null 
      };
    }
  }

  /**
   * Get worker by numeric ID
   * GET /workers/:id
   */
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.workersService.findOne(id);
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
    try {
      const worker = await this.workersService.findByUserId(req.user.userId);
      if (!worker) {
        throw new NotFoundException('Worker profile not found. Please complete your worker registration.');
      }
      return await this.workersService.acceptBooking(id, worker.id);
    } catch (error) {
      this.logger.error(`Error accepting booking ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
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
    try {
      const worker = await this.workersService.findByUserId(req.user.userId);
      if (!worker) {
        throw new NotFoundException('Worker profile not found. Please complete your worker registration.');
      }
      return await this.workersService.rejectBooking(id, worker.id, reason);
    } catch (error) {
      this.logger.error(`Error rejecting booking ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Start a job (mark as in progress)
   * POST /workers/bookings/:id/start
   */
  @Post('bookings/:id/start')
  @UseGuards(JwtAuthGuard)
  async startBooking(@Request() req, @Param('id') id: string) {
    try {
      const worker = await this.workersService.findByUserId(req.user.userId);
      if (!worker) {
        throw new NotFoundException('Worker profile not found. Please complete your worker registration.');
      }
      return await this.workersService.startBooking(id, worker.id);
    } catch (error) {
      this.logger.error(`Error starting booking ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Complete a job
   * POST /workers/bookings/:id/complete
   */
  @Post('bookings/:id/complete')
  @UseGuards(JwtAuthGuard)
  async completeBooking(@Request() req, @Param('id') id: string) {
    try {
      const worker = await this.workersService.findByUserId(req.user.userId);
      if (!worker) {
        throw new NotFoundException('Worker profile not found. Please complete your worker registration.');
      }
      return await this.workersService.completeBooking(id, worker.id);
    } catch (error) {
      this.logger.error(`Error completing booking ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Update worker availability
   * PATCH /workers/me/availability
   */
  @Patch('me/availability')
  @UseGuards(JwtAuthGuard)
  async updateMyAvailability(@Request() req, @Body('isAvailable') isAvailable: boolean) {
    try {
      const worker = await this.workersService.findByUserId(req.user.userId);
      if (!worker) {
        throw new NotFoundException('Worker profile not found. Please complete your worker registration.');
      }
      return await this.workersService.updateWorkerAvailability(worker.id, isAvailable);
    } catch (error) {
      this.logger.error(`Error updating availability: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
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

  /**
   * Update worker's FCM token for push notifications
   * PATCH /workers/me/fcm-token
   */
  @Patch('me/fcm-token')
  @UseGuards(JwtAuthGuard)
  async updateMyFcmToken(
    @Request() req,
    @Body('fcmToken') fcmToken: string,
  ) {
    this.logger.log(`Updating FCM token for user: ${req.user.userId}`);
    const worker = await this.workersService.findByUserId(req.user.userId);
    if (!worker) {
      this.logger.error(`Worker not found for user: ${req.user.userId}`);
      throw new NotFoundException('Worker profile not found');
    }
    return this.workersService.updateFcmToken(worker.id, fcmToken);
  }

  /**
   * Create worker profile for logged-in user
   * POST /workers/me/register
   * Protected by JWT - user must already be logged in
   * 
   * This endpoint is used when a user with an existing account wants to
   * become a worker by creating a worker profile.
   */
  @Post('me/register')
  @UseGuards(JwtAuthGuard)
  async registerWorker(@Request() req, @Body() body: { name?: string; bio?: string; serviceIds?: string[]; latitude?: number; longitude?: number }) {
    try {
      this.logger.log(`Worker registration request from user: ${req.user.userId}`);
      
      // Check if user already has a worker profile
      const existingWorker = await this.workersService.findByUserId(req.user.userId);
      if (existingWorker) {
        return {
          worker: existingWorker,
          message: 'Worker profile already exists',
          needsApproval: false
        };
      }
      
      // Create worker profile for this user
      const worker = await this.workersService.createWorkerProfile(
        req.user.userId,
        body.bio || '',
        body.serviceIds || [],
        body.latitude || 28.5804579,
        body.longitude || 77.4392951,
      );
      
      this.logger.log(`Worker profile created for user: ${req.user.userId}`);
      
      return {
        worker: worker,
        message: 'Worker registered successfully. Pending admin approval.',
        needsApproval: true
      };
    } catch (error) {
      this.logger.error(`Worker registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
