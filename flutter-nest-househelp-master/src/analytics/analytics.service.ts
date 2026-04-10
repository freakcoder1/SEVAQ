import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Worker } from '../workers/entities/worker.entity';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';

export interface RevenueTrendData {
  date: string;
  revenue: number;
}

export interface BookingTrendData {
  date: string;
  count: number;
}

export interface ServicePopularityData {
  service: string;
  count: number;
  revenue: number;
}

export interface WorkerPerformanceData {
  workerId: number;
  workerName: string;
  completedJobs: number;
  rating: number;
  reviewCount: number;
  completionRate: number;
}

export interface CustomerRetentionData {
  totalCustomers: number;
  repeatCustomers: number;
  retentionRate: number;
  averageBookingsPerCustomer: number;
}

export interface GeographicDistributionData {
  location: string;
  count: number;
  revenue: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async getRevenueTrend(days: number): Promise<RevenueTrendData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('DATE(booking.date)', 'date')
      .addSelect('COALESCE(SUM(booking.amount), 0)', 'revenue')
      .where('booking.date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.COMPLETED, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      })
      .groupBy('DATE(booking.date)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Fill in missing dates with 0 revenue
    const result: RevenueTrendData[] = [];
    const currentDate = new Date(startDate);
    const bookingMap = new Map(bookings.map((b) => [b.date, parseFloat(b.revenue)]));

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        revenue: bookingMap.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  async getBookingTrend(days: number): Promise<BookingTrendData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('DATE(booking.date)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('booking.date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .groupBy('DATE(booking.date)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Fill in missing dates with 0 count
    const result: BookingTrendData[] = [];
    const currentDate = new Date(startDate);
    const bookingMap = new Map(bookings.map((b) => [b.date, parseInt(b.count)]));

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: bookingMap.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  async getServicePopularity(): Promise<ServicePopularityData[]> {
    const bookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.service', 'service')
      .select('service.name', 'service')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(booking.amount), 0)', 'revenue')
      .groupBy('service.id')
      .addGroupBy('service.name')
      .orderBy('count', 'DESC')
      .getRawMany();

    return bookings.map((b) => ({
      service: b.service || 'Unknown',
      count: parseInt(b.count),
      revenue: parseFloat(b.revenue),
    }));
  }

  async getWorkerPerformance(): Promise<WorkerPerformanceData[]> {
    const workers = await this.workersRepository
      .createQueryBuilder('worker')
      .leftJoin('worker.user', 'user')
      .leftJoin('worker.bookings', 'booking')
      .select('worker.id', 'workerId')
      .addSelect("CONCAT(user.firstName, ' ', user.lastName)", 'workerName')
      .addSelect('COUNT(CASE WHEN booking.status = :completed THEN 1 END)', 'completedJobs')
      .addSelect('COUNT(booking.id)', 'totalJobs')
      .addSelect('AVG(worker.rating)', 'rating')
      .addSelect('worker.reviewCount', 'reviewCount')
      .setParameters({ completed: BookingStatus.COMPLETED })
      .groupBy('worker.id')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .addGroupBy('worker.rating')
      .addGroupBy('worker.reviewCount')
      .orderBy('completedJobs', 'DESC')
      .getRawMany();

    return workers.map((w) => {
      const completedJobs = parseInt(w.completedJobs) || 0;
      const totalJobs = parseInt(w.totalJobs) || 0;
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      return {
        workerId: w.workerId,
        workerName: w.workerName?.trim() || 'Unknown',
        completedJobs,
        rating: parseFloat(w.rating) || 0,
        reviewCount: parseInt(w.reviewCount) || 0,
        completionRate: Math.round(completionRate * 100) / 100,
      };
    });
  }

  async getCustomerRetention(): Promise<CustomerRetentionData> {
    const totalCustomers = await this.usersRepository.count();

    const repeatCustomerStats = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('COUNT(DISTINCT booking.userId)', 'totalBookings')
      .addSelect('COUNT(DISTINCT CASE WHEN bookingCount > 1 THEN booking.userId END)', 'repeatCustomers')
      .addSelect('AVG(bookingCount)', 'averageBookings')
      .leftJoin(
        (qb) =>
          qb
            .select('userId', 'userId')
            .addSelect('COUNT(*)', 'bookingCount')
            .from(Booking, 'booking')
            .groupBy('userId'),
        'userBookings',
        'booking.userId = userBookings.userId',
      )
      .getRawOne();

    const repeatCustomers = parseInt(repeatCustomerStats.repeatCustomers) || 0;
    const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
    const averageBookings = parseFloat(repeatCustomerStats.averageBookings) || 0;

    return {
      totalCustomers,
      repeatCustomers,
      retentionRate: Math.round(retentionRate * 100) / 100,
      averageBookingsPerCustomer: Math.round(averageBookings * 100) / 100,
    };
  }

  async getGeographicDistribution(): Promise<GeographicDistributionData[]> {
    const bookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.user', 'user')
      .select("COALESCE(user.address, 'Unknown')", 'location')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(booking.amount), 0)', 'revenue')
      .groupBy('user.address')
      .orderBy('count', 'DESC')
      .getRawMany();

    return bookings.map((b) => ({
      location: b.location || 'Unknown',
      count: parseInt(b.count),
      revenue: parseFloat(b.revenue),
    }));
  }
}
