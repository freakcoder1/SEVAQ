import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from '../workers/entities/worker.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedJobsToday = await this.bookingsRepository.count({
      where: {
        status: BookingStatus.COMPLETED,
        updatedAt: new Date(today.getTime()),
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
      .leftJoinAndSelect('worker.user', 'user')
      .leftJoinAndSelect('worker.services', 'services');

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
      query.andWhere('services.publicId = :serviceId', {
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
  }): Promise<Booking[]> {
    const query = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
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

    return query.orderBy('booking.date', 'DESC').addOrderBy('booking.startTime', 'DESC').getMany();
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
}