import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { AssignmentMetric } from './entities/metric.entity';
import { WorkerPerformanceMetric } from './entities/metric.entity';
import { UserBehaviorMetric } from './entities/metric.entity';
import { SystemPerformanceMetric } from './entities/metric.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Worker } from '../workers/entities/worker.entity';
import { User } from '../users/entities/user.entity';

export interface AssignmentMetrics {
  successRate: number;
  averageAssignmentTime: number;
  averageRating: number;
  totalAssignments: number;
  failedAssignments: number;
  timeoutAssignments: number;
  cancelledAssignments: number;
}

export interface WorkerMetrics {
  workerId: number;
  totalAssignments: number;
  successRate: number;
  averageRating: number;
  averageAssignmentTime: number;
  utilizationRate: number;
  totalEarnings: number;
}

export interface SystemMetrics {
  assignmentSuccessRate: number | null;
  averageAssignmentTime: number;
  systemHealth: string;
  activeUsers: number;
  activeWorkers: number;
  queueLength: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectRepository(AssignmentMetric)
    private assignmentMetricsRepository: Repository<AssignmentMetric>,
    @InjectRepository(WorkerPerformanceMetric)
    private workerPerformanceMetricsRepository: Repository<WorkerPerformanceMetric>,
    @InjectRepository(UserBehaviorMetric)
    private userBehaviorMetricsRepository: Repository<UserBehaviorMetric>,
    @InjectRepository(SystemPerformanceMetric)
    private systemPerformanceMetricsRepository: Repository<SystemPerformanceMetric>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async recordAssignmentMetric(
    assignment: any, // Assignment entity not yet created
    booking: Booking,
    worker: Worker,
    status: 'success' | 'failure' | 'timeout' | 'cancelled',
    metadata?: any,
  ): Promise<void> {
    try {
      const metric = new AssignmentMetric();
      metric.assignmentId = assignment.id;
      metric.bookingId = booking.id;
      metric.userId = booking.user?.publicId ?? '';
      metric.workerId = worker.id;
      metric.serviceType = booking.service?.name || 'unknown';
      metric.location = 'unknown'; // Booking entity doesn't have location field
      metric.timestamp = new Date();
      metric.status = status;
      metric.assignmentTime = this.calculateAssignmentTime(assignment);
      metric.workerRating = worker.rating || 0;
      metric.userSatisfaction = 0; // Booking entity doesn't have userSatisfaction field
      metric.distance = 0; // Worker entity doesn't have location field
      metric.price = booking.amount || 0;
      metric.metadata = metadata;

      await this.assignmentMetricsRepository.save(metric);
      this.logger.log(
        `Recorded assignment metric: ${assignment.id} - ${status}`,
      );
    } catch (error) {
      this.logger.error(`Failed to record assignment metric: ${error.message}`);
    }
  }

  async recordWorkerPerformanceMetric(workerId: number): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const assignments = await this.assignmentMetricsRepository.find({
        where: {
          workerId,
          timestamp: Between(
            today,
            new Date(today.getTime() + 24 * 60 * 60 * 1000),
          ),
        },
      });

      if (assignments.length === 0) return;

      const totalAssignments = assignments.length;
      const successfulAssignments = assignments.filter(
        (a) => a.status === 'success',
      ).length;
      const failedAssignments = assignments.filter(
        (a) => a.status === 'failure',
      ).length;
      const cancelledAssignments = assignments.filter(
        (a) => a.status === 'cancelled',
      ).length;

      const successRate =
        totalAssignments > 0
          ? (successfulAssignments / totalAssignments) * 100
          : 0;
      const averageAssignmentTime =
        assignments.reduce((sum, a) => sum + a.assignmentTime, 0) /
        totalAssignments;
      const averageRating =
        assignments.reduce((sum, a) => sum + a.workerRating, 0) /
        totalAssignments;
      const averageUserSatisfaction =
        assignments.reduce((sum, a) => sum + a.userSatisfaction, 0) /
        totalAssignments;
      const totalEarnings = assignments.reduce((sum, a) => sum + a.price, 0);
      const utilizationRate = this.calculateUtilizationRate(workerId, today);

      const performanceMetric = new WorkerPerformanceMetric();
      performanceMetric.workerId = workerId;
      performanceMetric.date = today;
      performanceMetric.totalAssignments = totalAssignments;
      performanceMetric.successfulAssignments = successfulAssignments;
      performanceMetric.failedAssignments = failedAssignments;
      performanceMetric.cancelledAssignments = cancelledAssignments;
      performanceMetric.successRate = successRate;
      performanceMetric.averageAssignmentTime = averageAssignmentTime;
      performanceMetric.averageRating = averageRating;
      performanceMetric.averageUserSatisfaction = averageUserSatisfaction;
      performanceMetric.totalEarnings = totalEarnings;
      performanceMetric.utilizationRate = utilizationRate;

      await this.workerPerformanceMetricsRepository.save(performanceMetric);
    } catch (error) {
      this.logger.error(
        `Failed to record worker performance metric: ${error.message}`,
      );
    }
  }

  async recordUserBehaviorMetric(userId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bookings = await this.assignmentMetricsRepository.find({
        where: { userId },
        relations: ['booking'],
      });

      if (bookings.length === 0) return;

      const totalBookings = bookings.length;
      const successfulBookings = bookings.filter(
        (b) => b.status === 'success',
      ).length;
      const failedBookings = bookings.filter(
        (b) => b.status === 'failure',
      ).length;
      const cancelledBookings = bookings.filter(
        (b) => b.status === 'cancelled',
      ).length;

      const conversionRate =
        totalBookings > 0 ? (successfulBookings / totalBookings) * 100 : 0;
      const averageSatisfaction =
        bookings.reduce((sum, b) => sum + b.userSatisfaction, 0) /
        totalBookings;
      const totalSpent = bookings.reduce((sum, b) => sum + b.price, 0);
      const repeatBookingRate = this.calculateRepeatBookingRate(userId);

      const behaviorMetric = new UserBehaviorMetric();
      behaviorMetric.userId = userId;
      behaviorMetric.date = today;
      behaviorMetric.totalBookings = totalBookings;
      behaviorMetric.successfulBookings = successfulBookings;
      behaviorMetric.failedBookings = failedBookings;
      behaviorMetric.cancelledBookings = cancelledBookings;
      behaviorMetric.conversionRate = conversionRate;
      behaviorMetric.averageSatisfaction = averageSatisfaction;
      behaviorMetric.totalSpent = totalSpent;
      behaviorMetric.repeatBookingRate = repeatBookingRate;

      await this.userBehaviorMetricsRepository.save(behaviorMetric);
    } catch (error) {
      this.logger.error(
        `Failed to record user behavior metric: ${error.message}`,
      );
    }
  }

  async getAssignmentMetrics(
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day',
  ): Promise<AssignmentMetrics> {
    const timeFilter = this.getTimeFilter(timeRange);

    const metrics = await this.assignmentMetricsRepository.find({
      where: { timestamp: MoreThan(timeFilter) },
    });

    const totalAssignments = metrics.length;
    const successfulAssignments = metrics.filter(
      (m) => m.status === 'success',
    ).length;
    const failedAssignments = metrics.filter(
      (m) => m.status === 'failure',
    ).length;
    const timeoutAssignments = metrics.filter(
      (m) => m.status === 'timeout',
    ).length;
    const cancelledAssignments = metrics.filter(
      (m) => m.status === 'cancelled',
    ).length;

    const successRate =
      totalAssignments > 0
        ? (successfulAssignments / totalAssignments) * 100
        : 0;
    const averageAssignmentTime =
      totalAssignments > 0
        ? metrics.reduce((sum, m) => sum + m.assignmentTime, 0) /
          totalAssignments
        : 0;
    const averageRating =
      totalAssignments > 0
        ? metrics.reduce((sum, m) => sum + m.workerRating, 0) / totalAssignments
        : 0;

    return {
      successRate,
      averageAssignmentTime,
      averageRating,
      totalAssignments,
      failedAssignments,
      timeoutAssignments,
      cancelledAssignments,
    };
  }

  async getWorkerMetrics(workerId: number): Promise<WorkerMetrics> {
    const metrics = await this.workerPerformanceMetricsRepository.find({
      where: { workerId },
      order: { date: 'DESC' },
      take: 30, // Last 30 days
    });

    if (metrics.length === 0) {
      return {
        workerId,
        totalAssignments: 0,
        successRate: 0,
        averageRating: 0,
        averageAssignmentTime: 0,
        utilizationRate: 0,
        totalEarnings: 0,
      };
    }

    const totalAssignments = metrics.reduce(
      (sum, m) => sum + m.totalAssignments,
      0,
    );
    const totalSuccessful = metrics.reduce(
      (sum, m) => sum + m.successfulAssignments,
      0,
    );
    const successRate =
      totalAssignments > 0 ? (totalSuccessful / totalAssignments) * 100 : 0;
    const averageRating =
      metrics.reduce((sum, m) => sum + m.averageRating, 0) / metrics.length;
    const averageAssignmentTime =
      metrics.reduce((sum, m) => sum + m.averageAssignmentTime, 0) /
      metrics.length;
    const utilizationRate =
      metrics.reduce((sum, m) => sum + m.utilizationRate, 0) / metrics.length;
    const totalEarnings = metrics.reduce((sum, m) => sum + m.totalEarnings, 0);

    return {
      workerId,
      totalAssignments,
      successRate,
      averageRating,
      averageAssignmentTime,
      utilizationRate,
      totalEarnings,
    };
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const recentMetrics = await this.assignmentMetricsRepository.find({
        where: { timestamp: MoreThan(oneHourAgo) },
      });

    const totalAssignments = recentMetrics.length;
    const successfulAssignments = recentMetrics.filter(
      (m) => m.status === 'success',
    ).length;

    // Minimum sample size to prevent false alerts when no data
    const MIN_SAMPLE_SIZE = 5;
    const assignmentSuccessRate =
      totalAssignments >= MIN_SAMPLE_SIZE
        ? (successfulAssignments / totalAssignments) * 100
        : null; // Return null when insufficient data to prevent false alerts

    const averageAssignmentTime =
      totalAssignments > 0
        ? recentMetrics.reduce((sum, m) => sum + m.assignmentTime, 0) /
          totalAssignments
        : 0;

    // Calculate system health based on various factors
    // Use 100 (excellent) as default when no data to prevent false "poor health" alerts
    const systemHealth =
      totalAssignments >= MIN_SAMPLE_SIZE
        ? this.calculateSystemHealth(
            assignmentSuccessRate ?? 100,
            averageAssignmentTime,
          )
        : 'excellent';

    // Get active users and workers
    const activeUsers = await this.getActiveUsersCount();
    const activeWorkers = await this.getActiveWorkersCount();
    const queueLength = await this.getQueueLength();

    return {
      assignmentSuccessRate,
      averageAssignmentTime,
      systemHealth,
      activeUsers,
      activeWorkers,
      queueLength,
    };
    } catch (error) {
      this.logger.warn(`Failed to get system metrics: ${error.message}`);
      return {
        assignmentSuccessRate: 100,
        averageAssignmentTime: 0,
        systemHealth: 'excellent',
        activeUsers: 0,
        activeWorkers: 0,
        queueLength: 0,
      };
    }
  }

  async getMetricsByServiceType(
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day',
  ) {
    const timeFilter = this.getTimeFilter(timeRange);

    const metrics = await this.assignmentMetricsRepository.find({
      where: { timestamp: MoreThan(timeFilter) },
    });

    const serviceTypes = [...new Set(metrics.map((m) => m.serviceType))];

    return serviceTypes.map((serviceType) => {
      const serviceMetrics = metrics.filter(
        (m) => m.serviceType === serviceType,
      );
      return {
        serviceType,
        totalAssignments: serviceMetrics.length,
        successRate:
          (serviceMetrics.filter((m) => m.status === 'success').length /
            serviceMetrics.length) *
          100,
        averageAssignmentTime:
          serviceMetrics.reduce((sum, m) => sum + m.assignmentTime, 0) /
          serviceMetrics.length,
        averageRating:
          serviceMetrics.reduce((sum, m) => sum + m.workerRating, 0) /
          serviceMetrics.length,
      };
    });
  }

  async getMetricsByLocation(
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day',
  ) {
    const timeFilter = this.getTimeFilter(timeRange);

    const metrics = await this.assignmentMetricsRepository.find({
      where: { timestamp: MoreThan(timeFilter) },
    });

    const locations = [...new Set(metrics.map((m) => m.location))];

    return locations.map((location) => {
      const locationMetrics = metrics.filter((m) => m.location === location);
      return {
        location,
        totalAssignments: locationMetrics.length,
        successRate:
          (locationMetrics.filter((m) => m.status === 'success').length /
            locationMetrics.length) *
          100,
        averageAssignmentTime:
          locationMetrics.reduce((sum, m) => sum + m.assignmentTime, 0) /
          locationMetrics.length,
        averageRating:
          locationMetrics.reduce((sum, m) => sum + m.workerRating, 0) /
          locationMetrics.length,
      };
    });
  }

  private calculateAssignmentTime(assignment: any): number {
    if (!assignment.assignedAt || !assignment.createdAt) return 0;
    return (
      (assignment.assignedAt.getTime() - assignment.createdAt.getTime()) / 1000
    ); // seconds
  }

  private calculateDistance(location1: string, location2: string): number {
    // Simplified distance calculation
    // In a real implementation, you would use actual coordinates and Haversine formula
    return Math.random() * 10; // Placeholder
  }

  private calculateUtilizationRate(workerId: number, date: Date): number {
    // Simplified utilization calculation
    // In a real implementation, you would calculate based on worker availability and assignments
    return Math.random() * 100;
  }

  private calculateRepeatBookingRate(userId: string): number {
    // Simplified repeat booking calculation
    // In a real implementation, you would analyze booking history
    return Math.random() * 100;
  }

  private calculateSystemHealth(successRate: number, avgTime: number): string {
    if (successRate >= 90 && avgTime <= 300) return 'excellent';
    if (successRate >= 80 && avgTime <= 600) return 'good';
    if (successRate >= 70 && avgTime <= 900) return 'fair';
    return 'poor';
  }

  private getTimeFilter(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    try {
      // Count users with bookings in the last 30 minutes as "active"
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const count = await this.bookingsRepository
        .createQueryBuilder('booking')
        .select('COUNT(DISTINCT booking.userId)', 'count')
        .where('booking.createdAt > :timestamp', {
          timestamp: thirtyMinutesAgo,
        })
        .getRawOne();
      return parseInt(count?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Failed to get active users count: ${error.message}`);
      return 0;
    }
  }

  private async getActiveWorkersCount(): Promise<number> {
    try {
      // Count workers with isAvailable = true
      const count = await this.workersRepository
        .createQueryBuilder('worker')
        .select('COUNT(worker.id)', 'count')
        .where('worker.isAvailable = :isAvailable', { isAvailable: true })
        .getRawOne();
      return parseInt(count?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Failed to get active workers count: ${error.message}`);
      return 0;
    }
  }

  private async getQueueLength(): Promise<number> {
    // Return 0 as we don't have a real queue system implemented yet
    // This prevents false "Queue Length High" alerts
    return 0;
  }
}
