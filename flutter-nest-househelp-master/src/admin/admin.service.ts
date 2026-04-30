import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull } from 'typeorm';
import { Worker } from '../workers/entities/worker.entity';
import { Booking, BookingStatus, AssignmentState, BookingType } from '../bookings/entities/booking.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  // ============================================
  // Dashboard Statistics
  // ============================================

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalWorkers: number;
    totalBookings: number;
    totalRevenue: number;
    activeSubscriptions: number;
    pendingAssignments: number;
    completedJobsToday: number;
    todayBookings: number;
    averageRating: number;
    bookingsByStatus: Record<string, number>;
    revenueByMonth: Array<{ month: string; revenue: number }>;
    topWorkers: Array<{ id: number; name: string; completedJobs: number; rating: number }>;
  }> {
    // Total users
    const totalUsers = await this.usersRepository.count({
      where: { role: UserRole.USER },
    });

    // Total workers
    const totalWorkers = await this.workersRepository.count();

    // Total bookings
    const totalBookings = await this.bookingsRepository.count();

    // Total revenue (completed bookings)
    const revenueResult = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.amount)', 'total')
      .where('booking.status = :status', { status: BookingStatus.COMPLETED })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult?.total || '0');

    // Active subscriptions
    const activeSubscriptions = await this.subscriptionsRepository.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    // Pending assignments (bookings with PENDING status)
    const pendingAssignments = await this.bookingsRepository.count({
      where: { status: BookingStatus.PENDING },
    });

    // Completed jobs today
    // Correct timezone handling for Asia/Calcutta (UTC+5:30)
    const now = new Date();
    // Get today's date in local timezone (Asia/Calcutta)
    const todayLocal = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    todayLocal.setUTCHours(0, 0, 0, 0);
    const startOfToday = new Date(todayLocal.getTime() - (5.5 * 60 * 60 * 1000));
    
    const endOfToday = new Date(startOfToday.getTime() + (24 * 60 * 60 * 1000) - 1);
    
    const completedJobsToday = await this.bookingsRepository.count({
      where: {
        status: BookingStatus.COMPLETED,
        updatedAt: Between(startOfToday, endOfToday),
      },
    });

    // Today's total bookings (all bookings created for today's date)
    // Format date correctly for Asia/Calcutta timezone
    // Calculate today's start and end in Asia/Calcutta timezone (UTC+5:30)
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    todayStart.setTime(todayStart.getTime() - (5.5 * 60 * 60 * 1000));
    
    const todayEnd = new Date(todayStart);
    todayEnd.setTime(todayEnd.getTime() + (24 * 60 * 60 * 1000) - 1);
      
    const todayBookings = await this.bookingsRepository.count({
      where: {
        createdAt: Between(todayStart, todayEnd),
      },
    });

    // Average rating
    const ratingResult = await this.workersRepository
      .createQueryBuilder('worker')
      .select('AVG(worker.rating)', 'avg')
      .where('worker.rating IS NOT NULL')
      .getRawOne();

    const averageRating = parseFloat(ratingResult?.avg || '0');

    // Bookings by status
    const bookingsByStatus = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('booking.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('booking.status')
      .getRawMany();

    const statusMap: Record<string, number> = {};
    for (const row of bookingsByStatus) {
      statusMap[row.status] = parseInt(row.count, 10);
    }

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select("TO_CHAR(booking.date, 'YYYY-MM')", 'month')
      .addSelect('SUM(booking.amount)', 'revenue')
      .where('booking.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('booking.date >= :date', { date: sixMonthsAgo.toISOString().split('T')[0] })
      .groupBy("TO_CHAR(booking.date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Top workers
    const topWorkers = await this.workersRepository
      .createQueryBuilder('worker')
      .leftJoin('worker.user', 'user')
      .select('worker.id', 'id')
      .addSelect('CONCAT(user.firstName, \' \', user.lastName)', 'name')
      .addSelect(
        (qb) =>
          qb
            .from(Booking, 'b')
            .select('COUNT(*)')
            .where('b.workerId = worker.id')
            .andWhere('b.status = :status', { status: BookingStatus.COMPLETED }),
        'completedJobs',
      )
      .addSelect('worker.rating', 'rating')
      .orderBy('rating', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalUsers,
      totalWorkers,
      totalBookings,
      totalRevenue,
      activeSubscriptions,
      pendingAssignments,
      completedJobsToday,
      todayBookings,
      averageRating: Math.round(averageRating * 10) / 10,
      bookingsByStatus: statusMap,
      revenueByMonth,
      topWorkers,
    };
  }

  // ============================================
  // Worker Management
  // ============================================

  /**
   * Get all workers with filters
   */
  async getAllWorkers(filters?: {
    isAvailable?: boolean;
    minRating?: number;
    serviceId?: string;
  }): Promise<Worker[]> {
    const query = this.workersRepository
      .createQueryBuilder('worker')
      .leftJoinAndSelect('worker.user', 'user');

    if (filters?.isAvailable !== undefined) {
      query.andWhere('worker.isAvailable = :isAvailable', {
        isAvailable: filters.isAvailable,
      });
    }

    if (filters?.minRating !== undefined) {
      query.andWhere('worker.rating >= :minRating', {
        minRating: filters.minRating,
      });
    }

    if (filters?.serviceId) {
      query.innerJoin('worker.services', 'services')
        .andWhere('services.publicId = :serviceId', {
          serviceId: filters.serviceId,
        });
    }

    return query.getMany();
  }

  /**
   * Get worker by ID
   */
  async getWorkerById(id: number): Promise<Worker | null> {
    return this.workersRepository.findOne({
      where: { id },
      relations: ['user', 'services'],
    });
  }

  /**
   * Update worker details
   */
  async updateWorker(id: number, updates: Partial<Worker>): Promise<Worker | null> {
    await this.workersRepository.update(id, updates);
    return this.workersRepository.findOne({
      where: { id },
      relations: ['user', 'services'],
    });
  }

  /**
   * Toggle worker availability
   */
  async toggleWorkerAvailability(id: number, isAvailable: boolean): Promise<Worker | null> {
    await this.workersRepository.update(id, { isAvailable });
    return this.workersRepository.findOne({
      where: { id },
      relations: ['user', 'services'],
    });
  }

  // ============================================
  // Booking Management
  // ============================================

  /**
   * Get all bookings with filters
   */
  async getAllBookings(filters?: {
    status?: BookingStatus;
    startDate?: string;
    endDate?: string;
    workerId?: number;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
     const query = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('user.addresses', 'userAddresses')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('booking.assignedWorker', 'assignedWorker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .leftJoinAndSelect('assignedWorker.user', 'assignedWorkerUser')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.slot', 'slot');

    if (filters?.status) {
      query.andWhere('booking.status = :status', { status: filters.status });
    }

    if (filters?.startDate) {
      query.andWhere('booking.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('booking.date <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.workerId) {
      query.andWhere('booking.workerId = :workerId', { workerId: filters.workerId });
    }

    if (filters?.userId) {
      query.andWhere('booking.userId = :userId', { userId: filters.userId });
    }

    query.orderBy('booking.date', 'DESC').addOrderBy('booking.startTime', 'DESC');

    // Apply pagination if provided
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    
    if (page && limit) {
      query.skip((page - 1) * limit).take(limit);
    }

    const [bookings, total] = await query.getManyAndCount();

    // Map bookings to add legacy worker properties that frontend expects
    const mappedBookings = bookings.map(booking => {
      const mapped: any = { ...booking };
      
      // Use new worker relation first, fallback to legacy assignedWorker for backwards compatibility
      const activeWorker = booking.worker || booking.assignedWorker;
      
      if (activeWorker) {
        mapped.workerId = activeWorker.id;
        mapped.worker = activeWorker;
        mapped.assignedWorker = activeWorker;
        
        // Check both possible user relation aliases (workerUser for new, assignedWorkerUser for legacy)
        const workerUserData = (activeWorker as any).workerUser || (activeWorker as any).assignedWorkerUser;
        
        // Add safe null check for worker user relation
        if (workerUserData) {
          const firstName = workerUserData.firstName || '';
          const lastName = workerUserData.lastName || '';
          mapped.workerName = `${firstName} ${lastName}`.trim();
        } else {
          mapped.workerName = 'Unassigned';
        }
      } else {
        mapped.workerName = 'Unassigned';
      }
      
      return mapped;
    });

    // Return array directly for backwards compatibility with frontend
    return mappedBookings;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking | null> {
    return this.bookingsRepository.findOne({
      where: { id },
      relations: ['user', 'worker', 'service', 'slot', 'payment'],
    });
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking | null> {
    await this.bookingsRepository.update(id, { status });
    return this.bookingsRepository.findOne({
      where: { id },
      relations: ['user', 'worker', 'service', 'slot'],
    });
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(id: string, reason?: string): Promise<Booking | null> {
    await this.bookingsRepository.update(id, {
      status: BookingStatus.CANCELLED,
    });
    return this.bookingsRepository.findOne({
      where: { id },
      relations: ['user', 'worker', 'service', 'slot'],
    });
  }

  /**
   * Get all unassigned bookings (workerId IS NULL)
   * Returns flattened data with customerName, serviceName, etc.
   */
  async getUnassignedBookings(): Promise<any[]> {
    const bookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.slot', 'slot')
      .where('booking.workerId IS NULL')
      .orWhere('booking.assignmentState = :state', { state: AssignmentState.PENDING })
      .orderBy('booking.createdAt', 'DESC')
      .getMany();

    // Flatten the data for frontend consumption
    return bookings.map(booking => ({
      ...booking,
      customerName: booking.user ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() : 'Unknown Customer',
      customerPhone: booking.user?.phone || '',
      customerAddress: booking.location?.address || booking.user?.address || '',
      serviceName: booking.service?.name || 'N/A',
      serviceId: booking.service?.id || booking.serviceId,
      // Ensure startTime and endTime are properly formatted
      startTime: booking.startTime || '',
      endTime: booking.endTime || '',
      date: booking.date || '',
    }));
  }

  /**
   * Manually assign a worker to a booking
   */
  async manualAssignBooking(
    bookingId: string,
    workerId: number,
    adminId: string | number,
    notes?: string,
  ): Promise<Booking | null> {
    // Find the booking
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'service'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Find the worker
    const worker = await this.workersRepository.findOne({
      where: { id: workerId },
      relations: ['user', 'services'],
    });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${workerId} not found`);
    }

    // Check if worker provides the required service
    if (booking.service && worker.services) {
      const hasService = worker.services.some(
        (s) => s.id === booking.service.id,
      );
      if (!hasService) {
        throw new BadRequestException(
          `Worker does not provide the required service: ${booking.service.name}`,
        );
      }
    }

    // Update the booking
    await this.bookingsRepository.update(bookingId, {
      workerId: workerId,
      assignedWorkerId: workerId,
      assignmentState: AssignmentState.ASSIGNED,
      status: BookingStatus.CONFIRMED,
    });

    // Return the updated booking with relations
    const updatedBooking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'worker', 'service', 'slot'],
    });

    return updatedBooking;
  }

  // ============================================
  // Analytics
  // ============================================

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    totalRevenue: number;
    averagePerBooking: number;
    revenueByService: Array<{ service: string; revenue: number }>;
    revenueByDate: Array<{ date: string; revenue: number }>;
  }> {
    let dateFormat: string;
    let startDate: Date;

    switch (period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case 'week':
        dateFormat = 'YYYY-IW';
        startDate = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        startDate = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000); // 12 months
        break;
      case 'year':
        dateFormat = 'YYYY';
        startDate = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000); // 5 years
        break;
    }

    // Total revenue
    const totalResult = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.amount)', 'total')
      .where('booking.status = :status', { status: BookingStatus.COMPLETED })
      .getRawOne();

    const totalRevenue = parseFloat(totalResult?.total || '0');

    // Average per booking
    const countResult = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('COUNT(*)', 'count')
      .where('booking.status = :status', { status: BookingStatus.COMPLETED })
      .getRawOne();

    const averagePerBooking = totalRevenue / (parseInt(countResult?.count || '1', 10) || 1);

    // Revenue by service
    const revenueByService = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.service', 'service')
      .select('service.name', 'service')
      .addSelect('SUM(booking.amount)', 'revenue')
      .where('booking.status = :status', { status: BookingStatus.COMPLETED })
      .groupBy('service.name')
      .orderBy('revenue', 'DESC')
      .getRawMany();

    // Revenue by date
    const revenueByDate = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select(`TO_CHAR(booking.date, '${dateFormat}')`, 'date')
      .addSelect('SUM(booking.amount)', 'revenue')
      .where('booking.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('booking.date >= :startDate', { startDate: startDate.toISOString().split('T')[0] })
      .groupBy(`TO_CHAR(booking.date, '${dateFormat}')`)
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averagePerBooking: Math.round(averagePerBooking * 100) / 100,
      revenueByService,
      revenueByDate,
    };
  }

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(): Promise<{
    totalBookings: number;
    bookingsByStatus: Array<{ status: string; count: number }>;
    bookingsByService: Array<{ service: string; count: number }>;
    bookingsByDate: Array<{ date: string; count: number }>;
    completionRate: number;
    cancellationRate: number;
  }> {
    // Total bookings
    const totalBookings = await this.bookingsRepository.count();

    // Bookings by status
    const bookingsByStatus = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('booking.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('booking.status')
      .getRawMany();

    // Bookings by service
    const bookingsByService = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.service', 'service')
      .select('service.name', 'service')
      .addSelect('COUNT(*)', 'count')
      .groupBy('service.name')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Bookings by date (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const bookingsByDate = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('TO_CHAR(booking.date, \'YYYY-MM-DD\')', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('booking.date >= :date', { date: thirtyDaysAgo.toISOString().split('T')[0] })
      .groupBy('TO_CHAR(booking.date, \'YYYY-MM-DD\')')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Calculate rates
    const completedCount = await this.bookingsRepository.count({
      where: { status: BookingStatus.COMPLETED },
    });
    const cancelledCount = await this.bookingsRepository.count({
      where: { status: BookingStatus.CANCELLED },
    });

    const completionRate = totalBookings > 0 ? (completedCount / totalBookings) * 100 : 0;
    const cancellationRate = totalBookings > 0 ? (cancelledCount / totalBookings) * 100 : 0;

    return {
      totalBookings,
      bookingsByStatus,
      bookingsByService,
      bookingsByDate,
      completionRate: Math.round(completionRate * 10) / 10,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
    };
  }

  // ============================================
  // User Management
  // ============================================

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.USER },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { publicId: id } as any,
    });
  }

  /**
   * Create worker profile for a user by email
   */
  async createWorkerProfileForUser(
    email: string,
    bio: string,
    serviceIds: string[],
    latitude: number,
    longitude: number,
  ): Promise<Worker | null> {
    // Find user by email
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error(`User not found with email: ${email}`);
    }

    // Check if worker already exists
    const existingWorker = await this.workersRepository.findOne({
      where: { user: { id: user.id } },
    });

    if (existingWorker) {
      return existingWorker;
    }

    // Load services if provided
    let services: Service[] = [];
    if (serviceIds && serviceIds.length > 0) {
      for (const serviceId of serviceIds) {
        const service = await this.servicesRepository.findOne({
          where: { id: parseInt(serviceId, 10) },
        });
        if (service) {
          services.push(service);
        }
      }
    }

    // Create worker profile
    const worker = this.workersRepository.create({
      user: { id: user.id },
      bio: bio || '',
      services: services,
      latitude: latitude || 28.5804579,
      longitude: longitude || 77.4392951,
      currentLat: latitude || 28.5804579,
      currentLng: longitude || 77.4392951,
      isAvailable: true,
    });

    const savedWorker = await this.workersRepository.save(worker);

    return this.workersRepository.findOne({
      where: { id: savedWorker.id },
      relations: ['user', 'services'],
    }) as Promise<Worker>;
  }

  // ===========================================
  // Assignment Metrics
  // ===========================================

  /**
   * Get assignment metrics
   */
  async getAssignmentMetrics(): Promise<{
    totalAssignments: number;
    avgAssignmentTime: number;
    successRate: number;
    pendingAssignments: number;
    failedAssignments: number;
    subscriptionAssignments: number;
    onDemandAssignments: number;
    scheduledAssignments: number;
    subscriptionPending: number;
    onDemandPending: number;
  }> {
    // Total assignments (bookings that have been assigned)
    const totalAssignments = await this.bookingsRepository.count({
      where: { workerId: Not(IsNull()) },
    });

    // Assignments by type
    const subscriptionAssignments = await this.bookingsRepository.count({
      where: { workerId: Not(IsNull()), type: BookingType.SUBSCRIPTION },
    });

    const onDemandAssignments = await this.bookingsRepository.count({
      where: { workerId: Not(IsNull()), type: BookingType.ON_DEMAND },
    });

    const scheduledAssignments = await this.bookingsRepository.count({
      where: { workerId: Not(IsNull()), type: BookingType.SCHEDULED },
    });

    // Pending assignments (unassigned)
    const pendingAssignments = await this.bookingsRepository.count({
      where: [
        { workerId: IsNull(), assignmentState: AssignmentState.PENDING },
        { workerId: IsNull(), status: BookingStatus.PENDING },
      ],
    });

    // Pending by type
    const subscriptionPending = await this.bookingsRepository.count({
      where: [
        { workerId: IsNull(), type: BookingType.SUBSCRIPTION, assignmentState: AssignmentState.PENDING },
        { workerId: IsNull(), type: BookingType.SUBSCRIPTION, status: BookingStatus.PENDING },
      ],
    });

    const onDemandPending = await this.bookingsRepository.count({
      where: [
        { workerId: IsNull(), type: BookingType.ON_DEMAND, assignmentState: AssignmentState.PENDING },
        { workerId: IsNull(), type: BookingType.ON_DEMAND, status: BookingStatus.PENDING },
      ],
    });

    // Failed assignments (cancelled bookings that were never assigned)
    const failedAssignments = await this.bookingsRepository.count({
      where: { status: BookingStatus.CANCELLED, workerId: IsNull() },
    });

    // Calculate success rate
    const completedAssignments = await this.bookingsRepository.count({
      where: { status: BookingStatus.COMPLETED, workerId: Not(IsNull()) },
    });
    const successRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

    // Average assignment time (simplified - using fixed value for now)
    const avgAssignmentTime = 15; // minutes (simplified)

    return {
      totalAssignments,
      avgAssignmentTime,
      successRate: Math.round(successRate * 10) / 10,
      pendingAssignments,
      failedAssignments,
      subscriptionAssignments,
      onDemandAssignments,
      scheduledAssignments,
      subscriptionPending,
      onDemandPending,
    };
  }
}