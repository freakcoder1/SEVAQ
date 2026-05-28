import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from './entities/worker.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WorkersService {
  private readonly logger = new Logger(WorkersService.name);
  constructor(
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {
    // DISABLED: Link workers to CLEANING service on startup
    // This was causing issues by adding Cleaning service to workers who didn't register for it
    // this.linkWorkersToCleaningService().catch(e =>
    //   this.logger.error('Failed to link workers to CLEANING service:', e)
    // );
  }

  private async linkWorkersToCleaningService() {
    try {
      const cleaningService = await this.servicesRepository.findOne({
        where: { category: 'Cleaning' },
      });
      
      if (!cleaningService) {
        this.logger.warn('CLEANING service not found, skipping worker linking');
        return;
      }
      
      const workerIds = [1, 3, 4, 5, 15];
      for (const workerId of workerIds) {
        // Check if worker exists
        const worker = await this.workersRepository.findOne({
          where: { id: workerId },
        });
        if (!worker) continue;
        
        // Check if already linked
        const existingLink = await this.workersRepository
          .createQueryBuilder('worker')
          .innerJoin('worker.services', 'service')
          .where('worker.id = :workerId', { workerId })
          .andWhere('service.id = :serviceId', { serviceId: cleaningService.id })
          .getOne();
        
        if (!existingLink) {
          worker.services = [...(worker.services || []), cleaningService];
          await this.workersRepository.save(worker);
          this.logger.log(`Linked worker ${workerId} to CLEANING service`);
        }
      }
    } catch (e) {
      this.logger.error('Error linking workers to CLEANING service:', e);
    }
  }

  async findAll() {
    return this.workersRepository.find({ relations: ['user', 'services'] });
  }

  async create(
    userId: number | string,
    bio: string,
    serviceIds: number[],
    latitude: number,
    longitude: number,
  ) {
    const worker = this.workersRepository.create({
      userId: userId as any,
      bio,
      services: serviceIds.map((id) => ({ id })),
      latitude,
      longitude,
      currentLat: latitude,
      currentLng: longitude,
      isAvailable: true,
      availabilitySchedule: [],
    });
    return this.workersRepository.save(worker);
  }

  async findOne(id: number) {
    return this.workersRepository.findOne({
      where: { id },
      relations: ['user', 'services'],
    });
  }

  async search(lat: number, long: number, radius: number) {
    return this.workersRepository
      .createQueryBuilder('worker')
      .leftJoinAndSelect('worker.user', 'user')
      .leftJoinAndSelect('worker.services', 'services')
      .where(
        `(
                6371 * acos(
                    cos(radians(:lat)) * cos(radians(user.latitude)) * cos(radians(user.longitude) - radians(:long)) +
                    sin(radians(:lat)) * sin(radians(user.latitude))
                )
            ) <= :radius`,
        { lat, long, radius },
      )
      .getMany();
  }

  async updateRating(id: string, rating: number, reviewCount: number) {
    await this.workersRepository.update(id, { rating, reviewCount });
  }

  async findByService(serviceId: string) {
    // Map frontend service IDs to actual UUID service IDs
    const serviceIdMap: Record<string, string> = {
      maid: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b', // Home Cleaning
      cleaning: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b', // Home Cleaning
      cooking: '7f8e4b5c-a883-4c6c-b348-f966508fd49d', // Cooking
    };

    const actualServiceId = serviceIdMap[serviceId] || serviceId;

    return this.workersRepository
      .createQueryBuilder('worker')
      .leftJoinAndSelect('worker.user', 'user')
      .leftJoinAndSelect('worker.services', 'services')
      .where('services.publicId = :serviceId', { serviceId: actualServiceId })
      .getMany();
  }

  async updateExistingWorkersWithDefaultLocation() {
    // Set default location for existing workers without location data
    await this.workersRepository
      .createQueryBuilder()
      .update(Worker)
      .set({
        latitude: 28.5804579,
        longitude: 77.4392951,
        currentLat: 28.5804579,
        currentLng: 77.4392951,
      })
      .where('latitude IS NULL OR longitude IS NULL')
      .execute();
  }

  async updateWorkerAvailability(id: number, isAvailable: boolean) {
    const worker = await this.workersRepository.findOne({ where: { id } });
    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // Validate location data before allowing worker to be marked as available
    if (isAvailable && (!worker.latitude || !worker.longitude)) {
      throw new BadRequestException('Cannot mark worker as available without location data');
    }

    await this.workersRepository.update(id, { isAvailable });
    return this.workersRepository.findOne({ where: { id } });
  }

  // ============================================
  // NEW: Worker-specific endpoints for Worker App
  // ============================================

  /**
   * Get worker profile by user ID (from JWT token)
   */
  async findByUserId(userId: string): Promise<Worker | null> {
    try {
      this.logger.debug(`findByUserId called with userId: ${userId}, type: ${typeof userId}`);
      
      // DEFENSIVE: Handle null/undefined/empty userId to prevent NaN errors
      if (!userId || typeof userId !== 'string' || userId === 'null' || userId === 'undefined') {
        this.logger.warn(`findByUserId called with invalid userId: ${userId}`);
        return null;
      }

      // Try to find by publicId first (UUID format) - this is the user's publicId from JWT
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      this.logger.debug(`Is UUID? ${isUUID}`);
      
      if (isUUID) {
        // First find the user by their publicId, then find the worker
        this.logger.debug(`Looking up user by publicId: ${userId}`);
        const user = await this.usersRepository.findOne({
          where: { publicId: userId },
        });
        this.logger.debug(`User found: ${user ? `id=${user.id}` : 'null'}`);
        if (user) {
          this.logger.debug(`Looking up worker by userId: ${user.id}`);
          const worker = await this.workersRepository.findOne({
            where: { userId: user.id },
            relations: ['user', 'services'],
          });
          this.logger.debug(`Worker found: ${worker ? `id=${worker.id}` : 'null'}`);
          if (worker) return worker;
        }
        
        // Also try finding worker directly by publicId (for backward compatibility)
        this.logger.debug(`Trying to find worker directly by publicId: ${userId}`);
        return this.workersRepository.findOne({
          where: { publicId: userId },
          relations: ['user', 'services'],
        });
      }
      
      // Fall back to finding by user.id (numeric)
      this.logger.debug(`Trying numeric userId: ${userId}`);
      const userIdNum = parseInt(userId, 10);
      this.logger.debug(`Parsed numeric: ${userIdNum}, isNaN: ${isNaN(userIdNum)}`);
      if (!isNaN(userIdNum)) {
        return this.workersRepository.findOne({
          where: { userId: userIdNum },
          relations: ['user', 'services'],
        });
      }
      
      this.logger.debug('No valid userId format, returning null');
      return null;
    } catch (error) {
      this.logger.error(`Error in findByUserId: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Get bookings assigned to this worker
   * Uses QueryBuilder to properly handle integer ID comparison
   * Checks both assignedWorkerId (integer) and workerId (UUID for legacy/one-time bookings)
   */
  async getWorkerBookings(workerId: number, status?: string): Promise<Booking[]> {
    // Build query using QueryBuilder for proper type handling
    // Query both:
    // - assignedWorkerId (integer) for subscription bookings
    // - workerId (integer) for legacy one-time/on-demand bookings
    // Note: The workerId column in the database is INTEGER type
    const queryBuilder = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.slot', 'slot')
      .leftJoinAndSelect('booking.subscription', 'subscription')
      .addSelect('booking.location')
      .where('(booking.assignedWorkerId = :workerId OR booking.workerId = :workerId)', { workerId });
    
    // Add status filter if provided
    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }
    
    queryBuilder.orderBy('booking.createdAt', 'DESC');
    queryBuilder.limit(500); // Limit to prevent overwhelming the app
    
    return queryBuilder.getMany();
  }

  /**
   * Get ONLY ACCEPTED / CONFIRMED bookings for this worker
   * Returns only bookings that have been explicitly accepted by the worker
   * Includes both subscription bookings AND one-time bookings
   * This is a dedicated endpoint for the "Ongoing Accepted Bookings" dashboard section
   */
  async getAcceptedWorkerBookings(workerId: number): Promise<Booking[]> {
    const acceptedStatuses = [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS];
    
    const queryBuilder = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.slot', 'slot')
      .leftJoinAndSelect('booking.subscription', 'subscription')
      .addSelect('booking.location')
      .where('(booking.assignedWorkerId = :workerId OR booking.workerId = :workerId)', { workerId })
      // Include both CONFIRMED and IN_PROGRESS statuses for accepted ongoing bookings
      .andWhere('booking.status IN (:...statuses)', { statuses: acceptedStatuses });
    
    queryBuilder.orderBy('booking.date', 'ASC'); // Sort by date, nearest first
    queryBuilder.addOrderBy('booking.startTime', 'ASC');
    queryBuilder.limit(100);
    
    return queryBuilder.getMany();
  }

  /**
   * Get earnings summary for a worker
   */
  async getWorkerEarnings(workerId: number): Promise<{
    totalEarnings: number;
    completedJobs: number;
    pendingPayments: number;
    thisMonth: number;
    lastMonth: number;
  }> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    // Total completed earnings
    const totalResult = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.amount)', 'total')
      .where('booking.workerId = :workerId', { workerId })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
      .getRawOne();

    // Completed jobs count
    const completedCount = await this.bookingsRepository.count({
      where: { workerId, status: BookingStatus.COMPLETED },
    });

    // Pending payments (confirmed but not completed)
    const pendingResult = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.amount)', 'total')
      .where('booking.workerId = :workerId', { workerId })
      .andWhere('booking.status IN (:...statuses)', { statuses: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] })
      .getRawOne();

    // This month's earnings
    const thisMonthResult = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.amount)', 'total')
      .where('booking.workerId = :workerId', { workerId })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('booking.date >= :date', { date: firstDayOfMonth })
      .getRawOne();

    // Last month's earnings
    const lastMonthResult = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.amount)', 'total')
      .where('booking.workerId = :workerId', { workerId })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('booking.date >= :startDate', { startDate: firstDayOfLastMonth })
      .andWhere('booking.date <= :endDate', { endDate: lastDayOfLastMonth })
      .getRawOne();

    return {
      totalEarnings: parseFloat(totalResult?.total || '0'),
      completedJobs: completedCount,
      pendingPayments: parseFloat(pendingResult?.total || '0'),
      thisMonth: parseFloat(thisMonthResult?.total || '0'),
      lastMonth: parseFloat(lastMonthResult?.total || '0'),
    };
  }

  private validateStateTransition(currentStatus: BookingStatus, targetStatus: BookingStatus): void {
    // All valid booking status transitions defined in single source of truth
    const validTransitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.REQUESTED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: []
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid state transition: Cannot change booking status from ${currentStatus} to ${targetStatus}`
      );
    }
  }

  /**
   * Accept a booking assignment
   */
  async acceptBooking(bookingId: string, workerId: number): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      select: ['id', 'workerId', 'assignedWorkerId', 'status', 'location', 'userId', 'serviceId', 'date', 'startTime', 'endTime', 'amount', 'createdAt', 'updatedAt']
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    // Validate worker exists
    const worker = await this.workersRepository.findOne({ where: { id: workerId } });
    
    if (!worker) {
      throw new NotFoundException('Worker not found');
    }
    
    // Check if booking is assigned to this worker (compare integer IDs)
    const isAssignedToWorker = booking.workerId === workerId || booking.assignedWorkerId === workerId;
    if (!isAssignedToWorker) {
      throw new BadRequestException('Booking is not assigned to this worker');
    }

    this.validateStateTransition(booking.status, BookingStatus.CONFIRMED);

    booking.status = BookingStatus.CONFIRMED;
    return this.bookingsRepository.save(booking);
  }

  /**
   * Reject a booking assignment
   */
  async rejectBooking(bookingId: string, workerId: number, reason?: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      select: ['id', 'workerId', 'assignedWorkerId', 'status', 'location', 'userId', 'serviceId', 'date', 'startTime', 'endTime', 'amount', 'createdAt', 'updatedAt']
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    
    // Validate worker exists
    const worker = await this.workersRepository.findOne({ where: { id: workerId } });
    
    if (!worker) {
      throw new NotFoundException('Worker not found');
    }
    
    // Check if booking is assigned to this worker (compare integer IDs)
    const isAssignedToWorker = booking.workerId === workerId || booking.assignedWorkerId === workerId;
    if (!isAssignedToWorker) {
      throw new BadRequestException('Booking is not assigned to this worker');
    }
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.REQUESTED) {
      throw new BadRequestException('Booking cannot be rejected in current status');
    }

    // For reject, just mark as cancelled but keep the workerId
    // The system will handle reassignment separately
    booking.status = BookingStatus.CANCELLED;
    return this.bookingsRepository.save(booking);
  }

  /**
   * Start a job (mark as in progress)
   */
  async startBooking(bookingId: string, workerId: number): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      select: ['id', 'workerId', 'assignedWorkerId', 'status', 'location', 'userId', 'serviceId', 'date', 'startTime', 'endTime', 'amount', 'createdAt', 'updatedAt']
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    
    // Validate worker exists
    const worker = await this.workersRepository.findOne({ where: { id: workerId } });
    
    // Check if booking is assigned to this worker (compare integer IDs)
    const isAssignedToWorker = booking.workerId === workerId || booking.assignedWorkerId === workerId;
    if (!isAssignedToWorker) {
      throw new BadRequestException('Booking is not assigned to this worker');
    }
    // Allow starting from CONFIRMED or REQUESTED status (on-demand bookings may be REQUESTED)
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.REQUESTED) {
      throw new BadRequestException('Booking must be confirmed before starting');
    }

    booking.status = BookingStatus.IN_PROGRESS;
    return this.bookingsRepository.save(booking);
  }

  /**
   * Complete a job
   */
  async completeBooking(bookingId: string, workerId: number): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      select: ['id', 'workerId', 'assignedWorkerId', 'status', 'location', 'userId', 'serviceId', 'date', 'startTime', 'endTime', 'amount', 'createdAt', 'updatedAt']
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    
    // Validate worker exists
    const worker = await this.workersRepository.findOne({ where: { id: workerId } });
    
    // Check if booking is assigned to this worker (compare integer IDs)
    const isAssignedToWorker = booking.workerId === workerId || booking.assignedWorkerId === workerId;
    if (!isAssignedToWorker) {
      throw new BadRequestException('Booking is not assigned to this worker');
    }
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Booking must be in progress to complete');
    }

    booking.status = BookingStatus.COMPLETED;
    return this.bookingsRepository.save(booking);
  }

  /**
   * Update worker profile details
   */
  async updateWorkerProfile(workerId: number, updateData: {
    bio?: string;
    yearsOfExperience?: number;
  }): Promise<Worker> {
    const worker = await this.workersRepository.findOne({ where: { id: workerId } });
    if (!worker) {
      throw new Error('Worker not found');
    }

    if (updateData.bio !== undefined) {
      worker.bio = updateData.bio;
    }
    if (updateData.yearsOfExperience !== undefined) {
      worker.yearsOfExperience = updateData.yearsOfExperience;
    }

    return this.workersRepository.save(worker);
  }

  /**
   * Update worker's service categories
   */
  async updateWorkerServices(workerId: number, serviceCategories: string[]): Promise<Worker> {
    const worker = await this.workersRepository.findOne({ 
      where: { id: workerId },
      relations: ['services'],
    });
    if (!worker) {
      throw new Error('Worker not found');
    }

    // Use ServicesService to find services by category
    // For now, we'll need to get the services repository directly
    const servicesRepo = this.bookingsRepository.manager.getRepository(Service);
    const services: Service[] = [];

    for (const category of serviceCategories) {
      const categoryMap: Record<string, string> = {
        'CLEANING': 'Cleaning',
        'COOKING': 'Cooking',
        'MAID': 'Cleaning',
        'HOME_CLEANING': 'Cleaning',
        'COOK': 'Cooking',
      };
      const dbCategory = categoryMap[category.toUpperCase()] || category;
      
      const service = await servicesRepo.findOne({ 
        where: { category: dbCategory } 
      });
      if (service) {
        services.push(service);
      }
    }

    worker.services = services;
    return this.workersRepository.save(worker);
  }

  /**
   * Update worker's service area
   */
  async updateWorkerServiceArea(workerId: number, serviceArea: {
    latitude: number;
    longitude: number;
    address: string;
    radiusKm?: number;
  }): Promise<Worker> {
    const worker = await this.workersRepository.findOne({ where: { id: workerId } });
    if (!worker) {
      throw new Error('Worker not found');
    }

    worker.serviceAreaId = '67856b26-d323-4ead-95f2-1be8fa361704'; // Greater Noida - Greater Noida West
    worker.latitude = serviceArea.latitude;
    worker.longitude = serviceArea.longitude;
    worker.currentLat = serviceArea.latitude;
    worker.currentLng = serviceArea.longitude;
    worker.currentLocationData = JSON.stringify({ address: serviceArea.address });
    if (serviceArea.radiusKm) {
      worker.serviceRadiusKm = serviceArea.radiusKm;
    }
    // Default to 25km if not specified
    if (!serviceArea.radiusKm) {
      worker.serviceRadiusKm = 25;
    }

    return this.workersRepository.save(worker);
  }

  /**
   * Get count of workers near a location
   * Used by home screen for "X verified professionals nearby" display
   */
  async getNearbyWorkersCount(lat: number, long: number, radius: number = 5): Promise<number> {
    const count = await this.workersRepository
      .createQueryBuilder('worker')
      .leftJoin('worker.user', 'user')
      .where(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(user.latitude)) * cos(radians(user.longitude) - radians(:long)) +
            sin(radians(:lat)) * sin(radians(user.latitude))
          )
        ) <= :radius`,
        { lat, long, radius },
      )
      .andWhere('worker.isAvailable = :isAvailable', { isAvailable: true })
      .getCount();
    
    return count;
  }

  /**
   * Get worker statistics (average response time, etc.)
   * Used by home screen for "X min average arrival" display
   */
  async getWorkerStats(): Promise<{
    avgResponseTime: number;
    totalWorkers: number;
    availableWorkers: number;
  }> {
    // Get total workers count
    const totalWorkers = await this.workersRepository.count();
    
    // Get available workers count
    const availableWorkers = await this.workersRepository.count({
      where: { isAvailable: true },
    });
    
    // Calculate average response time from completed bookings
    // FIX: Use updatedAt instead of startedAt (column doesn't exist in DB)
    // updatedAt on a completed booking approximates when work was finished,
    // so updatedAt - createdAt ~= total job duration. We use this as a proxy
    // for response time until a proper startedAt column is added.
    try {
      const avgResponseTimeResult = await this.bookingsRepository
        .createQueryBuilder('booking')
        .select('AVG(EXTRACT(EPOCH FROM (booking.updatedAt - booking.createdAt)))', 'avgSeconds')
        .where('booking.status = :status', { status: BookingStatus.COMPLETED })
        .andWhere('booking.updatedAt IS NOT NULL')
        .getRawOne();
      
      const avgSeconds = parseFloat(avgResponseTimeResult?.avgSeconds || '0');
      const avgResponseTime = Math.round(avgSeconds / 60) || 14; // Default to 14 minutes if no data
      
      return {
        avgResponseTime,
        totalWorkers,
        availableWorkers,
      };
    } catch (error) {
      this.logger.error(`Error calculating worker stats: ${error.message}`);
      // Return defaults so the home screen doesn't break
      return {
        avgResponseTime: 14,
        totalWorkers,
        availableWorkers,
      };
    }
  }

  /**
   * Update worker's FCM token for push notifications
   */
  async updateFcmToken(workerId: number, fcmToken: string): Promise<Worker> {
    this.logger.log(`updateFcmToken called for workerId: ${workerId}, token: ${fcmToken?.substring(0, 20)}...`);
    const worker = await this.workersRepository.findOne({ where: { id: workerId } });
    if (!worker) {
      this.logger.error(`Worker not found: ${workerId}`);
      throw new NotFoundException('Worker not found');
    }
    worker.fcmToken = fcmToken;
    const saved = await this.workersRepository.save(worker);
    this.logger.log(`FCM token saved for worker: ${workerId}`);
    return saved;
  }

  /**
   * Create a worker profile for a logged-in user
   * This is used when an existing user wants to become a worker
   * 
   * @param userPublicId - The user's publicId (UUID) from JWT token
   * @param bio - Worker bio/description
   * @param serviceIds - Array of service IDs (UUIDs)
   * @param latitude - Worker's location latitude
   * @param longitude - Worker's location longitude
   */
  async createWorkerProfile(
    userPublicId: string,
    bio: string,
    serviceIds: string[],
    latitude: number,
    longitude: number,
  ): Promise<Worker> {
    this.logger.log(`Creating worker profile for user: ${userPublicId}`);
    
    // ============================================
    // Priority 2: Validate required fields
    // ============================================
    
    // Validate bio (min 10 characters)
    if (!bio || bio.length < 10) {
      throw new Error('Bio is required and must be at least 10 characters');
    }
    
    // Validate location (latitude and longitude required)
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      throw new Error('Location is required (latitude and longitude)');
    }
    
    // Allow empty serviceIds for testing - use default service "Home Cleaning" UUID
    if (!serviceIds || serviceIds.length === 0) {
      this.logger.log('No services selected, using default service: Home Cleaning');
      serviceIds = ['6138cfa5-4ffd-47cf-b55f-55d4c30a6c51'];
    }

    // Try multiple ways to find the user
    let user: User | null = null;
    let userIdToUse: number | null = null;
    
    // 1. Try finding by publicId (UUID)
    if (userPublicId && userPublicId.includes('-')) {
      user = await this.usersRepository.findOne({
        where: { publicId: userPublicId },
      });
      if (user) {
        this.logger.log(`Found user by publicId: ${user.id} (${user.email})`);
        userIdToUse = user.id;
      }
    }
    
    // 2. If not found and looks like a numeric ID, try finding by internal id
    if (!user && userPublicId && !userPublicId.includes('-')) {
      const numericId = parseInt(userPublicId, 10);
      if (!isNaN(numericId)) {
        user = await this.usersRepository.findOne({
          where: { id: numericId },
        });
        if (user) {
          this.logger.log(`Found user by numeric id: ${user.id} (${user.email})`);
          userIdToUse = user.id;
        }
      }
    }
    
    // 3. If still not found, try finding by email (common for dev mode)
    if (!user && userPublicId && userPublicId.includes('@')) {
      user = await this.usersRepository.findOne({
        where: { email: userPublicId },
      });
      if (user) {
        this.logger.log(`Found user by email: ${user.id} (${user.email})`);
        userIdToUse = user.id;
      }
    }
    
    // If user still not found after all attempts, throw error
    if (!user) {
      this.logger.error(`User not found with any identifier: ${userPublicId}`);
      // Debug: list all users in DB to help diagnose
      const allUsers = await this.usersRepository.find({ take: 5 });
      this.logger.debug(`Debug - Sample users in DB: ${JSON.stringify(allUsers.map(u => ({ id: u.id, publicId: u.publicId, email: u.email })))}`);
      throw new Error('User not found');
    }
    
    this.logger.log(`Found user: ${user.id} (${user.email})`);
    
    // Load services if provided
    let services: Service[] = [];
    if (serviceIds && serviceIds.length > 0) {
      for (const serviceId of serviceIds) {
        const service = await this.servicesRepository.findOne({ 
          where: { publicId: serviceId } 
        });
        if (service) {
          services.push(service);
        }
      }
      this.logger.log(`Loaded ${services.length} services for worker`);
    }
    
    // ============================================
    // Priority 3: Set sensible default values
    // ============================================
    
    // Default availability schedule (Mon-Fri 8am-8pm)
    const defaultSchedule = [
      { day: 1, startTime: '08:00', endTime: '20:00' }, // Monday
      { day: 2, startTime: '08:00', endTime: '20:00' }, // Tuesday
      { day: 3, startTime: '08:00', endTime: '20:00' }, // Wednesday
      { day: 4, startTime: '08:00', endTime: '20:00' }, // Thursday
      { day: 5, startTime: '08:00', endTime: '20:00' }, // Friday
    ];
    
    // Create the worker profile with proper defaults
    const worker = this.workersRepository.create({
      user: { id: user.id },
      bio: bio,
      services: services,
      latitude: latitude,
      longitude: longitude,
      currentLat: latitude,
      currentLng: longitude,
      // Default 25km radius (like established workers)
      serviceRadiusKm: 25,
      // Default availability schedule
      availabilitySchedule: defaultSchedule,
      isAvailable: true,
    });
    
    const savedWorker = await this.workersRepository.save(worker);
    this.logger.log(`Worker profile created with ID: ${savedWorker.id} with 25km radius and default schedule`);
    
    // Reload with relations
    return this.workersRepository.findOne({
      where: { id: savedWorker.id },
      relations: ['user', 'services'],
    }) as Promise<Worker>;
  }
}
