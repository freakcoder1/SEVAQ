import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking, AssignmentState } from '../bookings/entities/booking.entity';
import { SlotsService } from '../slots/slots.service';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { AvailabilityService, AvailabilityCheckRequest, AvailabilityCheckResult } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private slotsService: SlotsService,
    private availabilityService: AvailabilityService,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async assignProfessional(assignmentRequest: {
    bookingId: string;
    serviceId: number;
    userLat: number;
    userLng: number;
    startTime: string;
    endTime: string;
  }): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    
    // 1. Validate booking exists and is in PENDING state
    const booking = await this.bookingsRepository.findOne({
      where: { id: assignmentRequest.bookingId }
    });

    if (!booking || booking.assignmentState !== AssignmentState.PENDING) {
      throw new BadRequestException('Invalid booking state for assignment');
    }

    // 2. Find best worker using existing logic
    const bestWorker = await this.findBestWorker(
      assignmentRequest.serviceId,
      assignmentRequest.userLat,
      assignmentRequest.userLng,
      assignmentRequest.startTime,
      assignmentRequest.endTime
    );

    if (!bestWorker) {
      return { success: false, reason: 'No professional available' };
    }

    // 3. Update booking with assignment
    const assignmentMetadata = {
      distance: bestWorker.distance,
      workerRating: bestWorker.worker.rating,
      workerExperience: bestWorker.worker.yearsOfExperience,
      matchingScore: bestWorker.score
    };

    await this.bookingsRepository.update(booking.id, {
      assignmentState: AssignmentState.ASSIGNED,
      assignedWorkerId: bestWorker.worker.id,
      assignmentTimestamp: new Date(),
      assignmentReason: 'Best match based on distance, rating, and availability',
      assignmentMetadata: JSON.stringify(assignmentMetadata)
    });

    // 4. Mark slot as booked (atomic - prevents race conditions)
    const slotBooked = await this.slotsService.markAsBooked(bestWorker.slot.id);
    if (!slotBooked) {
      this.logger.warn(
        `Slot ${bestWorker.slot.id} was already booked by another request (race condition). Reverting assignment.`,
      );
      // Revert the booking assignment since the slot is no longer available
      await this.bookingsRepository.update(booking.id, {
        assignmentState: AssignmentState.PENDING,
        assignedWorkerId: undefined,
        assignmentTimestamp: undefined,
        assignmentReason: undefined,
        assignmentMetadata: undefined,
      });
      return { success: false, reason: 'Slot was booked by another request' };
    }

    // Fetch the full booking with relations for notification
    const fullBooking = await this.bookingsRepository.findOne({
      where: { id: booking.id },
      relations: ['user', 'worker', 'service', 'worker.user']
    });

    // Send push notification to worker
    if (fullBooking) {
      try {
        await this.notificationsService.notifyWorkerNewBooking(bestWorker.worker, fullBooking);
      } catch (error) {
        // Log but don't fail the assignment if notification fails
        this.logger.error('Failed to send worker notification:', error);
      }
    }

    return { success: true, worker: bestWorker.worker };
  }

  async reassignProfessional(bookingId: string): Promise<{ success: boolean; worker?: Worker }> {
    // 1. Get current booking
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId }
    });

    if (!booking || !booking.assignedWorkerId) {
      throw new BadRequestException('No professional assigned to reassign');
    }

    // 2. Release current worker's slot
    // Parse time strings to Date objects for slot lookup
    const parseTimeToDate = (time: string): Date => {
      if (time.includes('T')) {
        // Full ISO datetime
        return new Date(time);
      }
      // Time string HH:mm:ss - combine with today's date
      const parts = time.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1] || '0', 10);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };
    
    const currentSlot = await this.slotsService.findBookedSlot(
      booking.assignedWorkerId, 
      parseTimeToDate(booking.startTime), 
      parseTimeToDate(booking.endTime)
    );
    
    if (currentSlot) {
      await this.slotsService.markAsAvailable(currentSlot.id);
    }

    // 3. Update booking state
    await this.bookingsRepository.update(booking.id, {
      assignmentState: AssignmentState.REASSIGNING,
      assignedWorkerId: undefined,
      reassignmentCount: booking.reassignmentCount + 1
    });

    // 4. Find new worker
    const newAssignment = await this.assignProfessional({
      bookingId: booking.id,
      serviceId: booking.serviceId,
      userLat: booking.user.latitude,
      userLng: booking.user.longitude,
      startTime: booking.startTime,
      endTime: booking.endTime
    });

    return newAssignment;
  }

  async getAssignmentStatus(bookingId: string): Promise<{
    status: AssignmentState;
    assignedWorkerId?: number;
    reassignmentCount: number;
    assignmentTimestamp?: Date;
    assignmentMetadata?: any;
  }> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    return {
      status: booking.assignmentState,
      assignedWorkerId: booking.assignedWorkerId,
      reassignmentCount: booking.reassignmentCount,
      assignmentTimestamp: booking.assignmentTimestamp,
      assignmentMetadata: booking.assignmentMetadata ? JSON.parse(booking.assignmentMetadata) : null
    };
  }

  async getLatestAssignmentStatus(): Promise<{
    status: AssignmentState;
    assignedWorkerId?: string;
    reassignmentCount: number;
    assignmentTimestamp?: Date;
    assignmentMetadata?: any;
  }> {
    // Get the latest booking for the current user (assuming we can get user from context)
    // For now, return a default status
    return {
      status: AssignmentState.PENDING,
      reassignmentCount: 0
    };
  }

  async createBookingWithAssignment(createBookingDto: any): Promise<Booking> {
    // 1. Create booking with PENDING assignment state
    // Parse dates from DTO
    const startTime = typeof createBookingDto.startTime === 'string' 
      ? new Date(createBookingDto.startTime) 
      : createBookingDto.startTime;
    const endTime = typeof createBookingDto.endTime === 'string' 
      ? new Date(createBookingDto.endTime) 
      : createBookingDto.endTime;

    const booking = this.bookingsRepository.create({
      ...createBookingDto,
      startTime: startTime.toTimeString().split(' ')[0], // Extract HH:MM:SS
      endTime: endTime.toTimeString().split(' ')[0], // Extract HH:MM:SS
      date: startTime, // This will be stored as date type in PostgreSQL
      assignmentState: AssignmentState.PENDING,
      assignedWorkerId: null,
      reassignmentCount: 0
    });

    const savedBooking = await this.bookingsRepository.save(booking);

    // 2. Trigger assignment process (could be async in production)
    // For now, we'll let the frontend trigger assignment explicitly
    return Array.isArray(savedBooking) ? savedBooking[0] : savedBooking;
  }

  // NEW: Two-phase assignment methods

  async checkAvailabilityForAssignment(assignmentRequest: {
    serviceId: number;
    userLat: number;
    userLng: number;
    startTime: string;
    endTime: string;
  }): Promise<{ available: boolean; estimatedWaitTime?: number; alternativeSlots?: any[] }> {
    console.log('🔍 Checking availability for assignment request:', assignmentRequest);

    // Use availability service to check if workers are available
    // Convert string dates to Date objects if needed
    const startTime = typeof assignmentRequest.startTime === 'string'
      ? new Date(assignmentRequest.startTime)
      : assignmentRequest.startTime;

    // Validate startTime is a valid Date
    if (!startTime || isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid startTime provided');
    }

    const availabilityRequest: AvailabilityCheckRequest = {
      serviceId: assignmentRequest.serviceId,
      date: startTime.toISOString(),
      timeWindow: this.getTimeWindowFromTime(startTime),
      userLat: assignmentRequest.userLat,
      userLng: assignmentRequest.userLng,
      radius: 5
    };

    console.log('📡 Availability request to service:', availabilityRequest);

    const result = await this.availabilityService.checkAvailability(availabilityRequest);

    console.log('📊 Availability result:', result);

    return {
      available: result.status === 'available' || result.status === 'limited',
      estimatedWaitTime: result.estimatedWaitTime,
      alternativeSlots: result.alternativeTimeSlots
    };
  }

  async attemptAssignment(assignmentRequest: {
    bookingId: number;
    serviceId: number;
    userLat: number;
    userLng: number;
    startTime: string;
    endTime: string;
  }): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    console.log('=== ASSIGNMENT ATTEMPT ===');
    console.log('Request:', assignmentRequest);
    
    // Log the booking ID and service ID for debugging
    console.log('📋 Booking ID:', assignmentRequest.bookingId);
    console.log('🔧 Service ID:', assignmentRequest.serviceId);

    try {
      // 1. Validate booking exists and is in PENDING state
      const booking = await this.bookingsRepository.findOne({
        where: { id: assignmentRequest.bookingId as any },
        relations: ['user', 'service'],
      });
      if (!booking) {
        console.log('Booking not found');
        return { success: false, reason: 'Booking not found' };
      }

      if (booking.assignmentState !== AssignmentState.PENDING) {
        console.log('Invalid booking state:', booking.assignmentState);
        return { success: false, reason: `Invalid booking state: ${booking.assignmentState}` };
      }

      console.log('Booking validation passed');

      // 2. Find best worker using enhanced logic
      console.log('Starting worker search...');
      const bestWorker = await this.findBestWorker(
        assignmentRequest.serviceId,
        assignmentRequest.userLat,
        assignmentRequest.userLng,
        assignmentRequest.startTime,
        assignmentRequest.endTime
      );

      console.log('Best worker found:', bestWorker ? 'YES' : 'NO');

      if (!bestWorker) {
        console.log('No worker available');
        return { success: false, reason: 'No professional available' };
      }

      console.log('Worker found:', bestWorker.worker.id, 'type:', typeof bestWorker.worker.id);

      // 3. Update booking with assignment
      const assignmentMetadata = {
        distance: bestWorker.distance,
        workerRating: bestWorker.worker.rating,
        workerExperience: bestWorker.worker.yearsOfExperience,
        matchingScore: bestWorker.score,
        slotId: bestWorker.slot.id,
        slotStartTime: bestWorker.slot.startTime,
        slotEndTime: bestWorker.slot.endTime
      };

      console.log('Updating booking with assignment...');
      console.log('Setting assignedWorkerId to:', bestWorker.worker.id, 'type:', typeof bestWorker.worker.id);
      await this.bookingsRepository.update(booking.id, {
        assignmentState: AssignmentState.ASSIGNED,
        assignedWorkerId: bestWorker.worker.id,
        assignmentTimestamp: new Date(),
        assignmentReason: 'Best match based on distance, rating, and availability',
        assignmentMetadata: JSON.stringify(assignmentMetadata)
      });

      // 4. Mark slot as booked
      console.log('Marking slot as booked:', bestWorker.slot.id);
      const bookingSuccess = await this.slotsService.bookSlot(bestWorker.slot.id);
      
      if (!bookingSuccess) {
        console.log('Failed to book slot, rolling back assignment');
        // Rollback assignment if slot booking fails
        await this.bookingsRepository.update(booking.id, {
          assignmentState: AssignmentState.PENDING,
          assignedWorkerId: undefined,
          assignmentTimestamp: undefined,
          assignmentReason: undefined,
          assignmentMetadata: undefined
        });
        return { success: false, reason: 'Failed to book worker slot' };
      }

      // Fetch the full booking with relations for notification
      const fullBooking = await this.bookingsRepository.findOne({
        where: { id: booking.id },
        relations: ['user', 'worker', 'service', 'worker.user']
      });

      // Send push notification to worker
      if (fullBooking) {
        try {
          await this.notificationsService.notifyWorkerNewBooking(bestWorker.worker, fullBooking);
        } catch (error) {
          // Log but don't fail the assignment if notification fails
          this.logger.error('Failed to send worker notification:', error);
        }
      }

      console.log('=== ASSIGNMENT SUCCESS ===');
      return { success: true, worker: bestWorker.worker };
      
    } catch (error) {
      console.error('Assignment failed with error:', error);
      return { success: false, reason: `Assignment failed: ${error.message}` };
    }
  }

  private getTimeWindowFromTime(date: Date): string {
    const hour = date.getHours();
    
    if (hour >= 8 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 17) {
      return 'afternoon';
    } else {
      return 'evening';
    }
  }

  // Enhanced worker matching logic with flexible time matching and comprehensive logging
  private async findBestWorker(serviceId: number, userLat: number, userLng: number, startTime: Date | string, endTime: Date | string) {
    console.log('🔍 Starting worker search for service:', serviceId);
    console.log('📍 User location:', { lat: userLat, lng: userLng });
    console.log('⏰ Requested time:', { start: startTime, end: endTime });

    // Find all workers who offer this service using proper join table query
    console.log('🔍 Executing worker query for service:', serviceId);
    console.log('🔍 Query will use join table: service_worker');

    const workers = await this.workersRepository
      .createQueryBuilder('worker')
      .innerJoin('service_worker', 'sw', 'sw.worker_id = worker.id')
      .innerJoin('service', 'service', 'service.id = sw.service_id')
      .leftJoin('worker.user', 'user')  // Load user relation
      .addSelect(['user.id', 'user.firstName', 'user.lastName', 'user.email'])  // Select user fields
      .where('service.id = :serviceId')
      .andWhere('worker.isActive = :isActive')
      .andWhere('worker.isAvailable = :isAvailable')
      .setParameters({ serviceId, isActive: true, isAvailable: true })
      .getMany();

    console.log('👷 Found workers for service:', workers.length);
    
    // Debug: Log worker IDs for verification
    if (workers.length > 0) {
      console.log('📋 Worker IDs found:', workers.map(w => w.id).join(', '));
    }

    if (workers.length === 0) {
      console.log('❌ No workers found for service');
      return null;
    }

    // Score each worker with enhanced logic
    const scoredWorkers = await Promise.all(workers.map(async (worker) => {
      const user = worker.user;
      if (!user) {
        console.log(`⚠️ Worker ${worker.id} has no associated user`);
        return null;
      }
      
      // Enhanced location fallback logic
      let workerLat = worker.currentLat;
      let workerLng = worker.currentLng;
      
      // Fallback 1: Use worker's primary location
      if (!workerLat || !workerLng) {
        workerLat = worker.latitude;
        workerLng = worker.longitude;
        console.log(`📍 Using primary location for worker ${worker.id}`);
      }
      
      // Fallback 2: Use user's location
      if (!workerLat || !workerLng) {
        workerLat = user.latitude;
        workerLng = user.longitude;
        console.log(`📍 Using user location for worker ${worker.id}`);
      }
      
      // Final fallback: Skip workers without any location data
      if (!workerLat || !workerLng) {
        console.log(`❌ Skipping worker ${worker.id} - no location data available`);
        return null;
      }

      // Calculate distance
      const distance = this.calculateDistance(userLat, userLng, workerLat, workerLng);
      console.log(`📏 Worker ${worker.id} distance: ${distance.toFixed(2)}km`);
      
      // Flexible radius check (start with 25km, expand if needed)
      const maxRadius = 30; // Increased from 15km to cover wider service areas
      if (distance > maxRadius) {
        console.log(`❌ Worker ${worker.id} too far (${distance.toFixed(2)}km > ${maxRadius}km)`);
        return null;
      }

      // Convert string dates to Date objects if needed
      const startTimeDate = typeof startTime === 'string' ? new Date(startTime) : startTime;
      const endTimeDate = typeof endTime === 'string' ? new Date(endTime) : endTime;
      
      // Enhanced availability check with multiple fallback strategies
      let availableSlot = await this.slotsService.findAvailableSlotFlexible(worker.id, startTimeDate, endTimeDate);
      
      if (!availableSlot) {
        console.log(`❌ Worker ${worker.id} not available for requested time, trying alternative strategies...`);
        
        // Strategy 1: Try exact time match
        availableSlot = await this.slotsService.findAvailableSlot(worker.id, startTimeDate, endTimeDate);
        if (availableSlot) {
          console.log(`✅ Worker ${worker.id} found with exact time match`);
        }
      }
      
      if (!availableSlot) {
        // Strategy 2: Try to find any available slot for the worker on the same day
        const requestedDate = new Date(startTimeDate.getFullYear(), startTimeDate.getMonth(), startTimeDate.getDate());
        const nextDay = new Date(requestedDate);
        nextDay.setDate(requestedDate.getDate() + 1);

        const sameDaySlots = await this.slotsService.getAvailableSlotsForWorker(worker.id, requestedDate, nextDay);
        
        if (sameDaySlots.length > 0) {
          console.log(`✅ Worker ${worker.id} found with same-day alternative slot`);
          availableSlot = sameDaySlots[0]; // Use the earliest available slot
        }
      }
      
      if (!availableSlot) {
        console.log(`❌ Worker ${worker.id} not available with any strategy`);
        return null;
      }

      // Calculate score - prioritize DISTANCE (closest worker wins) + WORKER PREFERENCE
      // Worker preference: Give bonus for Sumit and CP Pandey
      const WORKER_PREFERENCE_SCORE = 50; // Large negative score to prioritize these workers
      let workerPreferenceBonus = 0;
      const preferredWorkerNames = ['sumit', 'cp pandey', 'pandey'];
      const workerNameLower = (worker.user?.firstName || '').toLowerCase() + ' ' + (worker.user?.lastName || '').toLowerCase();
      if (preferredWorkerNames.some(name => workerNameLower.includes(name))) {
        workerPreferenceBonus = WORKER_PREFERENCE_SCORE;
        console.log(`⭐ Worker ${worker.id} (${workerNameLower}) gets preference bonus!`);
      }
      
      const distanceScore = distance * 0.6 * 10; // 60% weight - distance is most important
      const ratingScore = (5 - worker.rating) * 8 * 0.2; // 20% weight
      const reviewScore = (100 - Math.min(worker.reviewCount, 100)) * 0.2; // 20% weight

      const totalScore = distanceScore + ratingScore + reviewScore - workerPreferenceBonus;

      console.log(`✅ Worker ${worker.id} scored: ${totalScore.toFixed(2)} (distance: ${distance.toFixed(2)}km, rating: ${worker.rating})`);

      return {
        worker,
        distance,
        score: totalScore,
        slot: availableSlot
      };
    }));

    // Filter out unavailable workers and sort by score
    const availableWorkers = scoredWorkers.filter(w => w !== null).sort((a, b) => a.score - b.score);

    console.log('🏆 Available workers after scoring:', availableWorkers.length);

    if (availableWorkers.length === 0) {
      console.log('❌ No workers available after all filters');
      return null;
    }

    return availableWorkers[0]; // Return best match
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Methods needed by other services
  async confirmProvisionalAssignment(bookingId: string): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    try {
      const booking = await this.bookingsRepository.findOne({
        where: { id: bookingId as any },
        relations: ['user', 'service'],
      });

      if (!booking) {
        return { success: false, reason: 'Booking not found' };
      }

      if (booking.assignmentState !== AssignmentState.PROVISIONAL_ASSIGNED) {
        return { success: false, reason: `Invalid booking state: ${booking.assignmentState}` };
      }

      booking.assignmentState = AssignmentState.ASSIGNED;
      await this.bookingsRepository.save(booking);

      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async createPrimaryAssignment(bookingId: string): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    try {
      const booking = await this.bookingsRepository.findOne({
        where: { id: bookingId as any },
        relations: ['user', 'service'],
      });

      if (!booking) {
        return { success: false, reason: 'Booking not found' };
      }

      if (booking.assignmentState !== AssignmentState.PENDING) {
        return { success: false, reason: `Invalid booking state: ${booking.assignmentState}` };
      }

      // Get user location - try user profile first, then fallback to subscription location
      let userLocation = await this.getUserLocationByPublicId(booking.user.publicId);
      
      // Fallback: If user location not found, try to get location from subscription
      if (!userLocation) {
        userLocation = await this.getSubscriptionLocationForBooking(booking.id, booking.user.publicId, booking.date);
      }
      
      if (!userLocation) {
        return { success: false, reason: 'User location not found' };
      }

      const result = await this.findBestWorker(
        booking.serviceId,
        userLocation.lat,
        userLocation.lng,
        booking.startTime,
        booking.endTime,
      );

      if (!result || !result.worker) {
        return { success: false, reason: 'No available worker found' };
      }

      booking.assignmentState = AssignmentState.ASSIGNED;
      booking.workerId = result.worker.id;
      await this.bookingsRepository.save(booking);

      return { success: true, worker: result.worker };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Get user location by their public ID (UUID)
   * CRITICAL: Must use publicId (UUID) because that's what relationships are based on
   */
  async getUserLocationByPublicId(userPublicId: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Query the user by their public ID (UUID)
      const user = await this.usersRepository.findOne({
        where: { publicId: userPublicId },
      });
      
      if (!user) {
        this.logger.warn(`User not found for publicId: ${userPublicId}`);
        return null;
      }
      
      // Try multiple location fields with fallback
      // 1. preferredLat/preferredLng (preferred location)
      // 2. latitude/longitude (regular location)
      const lat = user.preferredLat || user.latitude;
      const lng = user.preferredLng || user.longitude;
      
      if (lat && lng) {
        return {
          lat: parseFloat(lat as unknown as string),
          lng: parseFloat(lng as unknown as string),
        };
      }
      
      this.logger.warn(`No location data found for user publicId: ${userPublicId}`);
      return null;
    } catch (error) {
      this.logger.error(`Error fetching user location for publicId ${userPublicId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get subscription location for a booking when user location is not available
   * This is used as a fallback for subscription bookings where location is stored in the subscription
   */
  async getSubscriptionLocationForBooking(
    bookingId: string,
    userPublicId: string,
    bookingDate: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      // Find active subscription for this user that matches the booking date using DataSource
      const subscription = await this.dataSource
        .createQueryBuilder()
        .select('subscription')
        .from('subscription', 'subscription')
        .where('subscription.userId = :userPublicId', { userPublicId })
        .andWhere('subscription.status = :status', { status: 'active' })
        .andWhere('subscription.startDate <= :bookingDate', { bookingDate })
        .orderBy('subscription.startDate', 'DESC')
        .take(1)
        .getOne();

      if (!subscription) {
        this.logger.warn(`No active subscription found for user publicId: ${userPublicId}`);
        return null;
      }

      // Extract location from subscription - handle both JSON and separate lat/lng columns
      const location = subscription.location as any;
      if (location && typeof location === 'object') {
        if (location.lat && location.lng) {
          return {
            lat: parseFloat(location.lat),
            lng: parseFloat(location.lng),
          };
        }
      }

      this.logger.warn(`No location data in subscription for user publicId: ${userPublicId}`);
      return null;
    } catch (error) {
      this.logger.error(`Error fetching subscription location for user ${userPublicId}: ${error.message}`);
      return null;
    }
  }
}