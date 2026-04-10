import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from '../workers/entities/worker.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';

export interface WorkerLocation {
  workerId: number;
  workerName: string;
  email: string;
  phone: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  isActive: boolean;
  rating: number;
  currentBookingId?: string;
  currentBookingStatus?: string;
}

export interface ActiveBooking {
  id: string;
  publicId: string;
  customerName: string;
  customerPhone: string;
  workerName: string;
  serviceName: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  address: string;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async getWorkerLocations(): Promise<WorkerLocation[]> {
    const workers = await this.workersRepository
      .createQueryBuilder('worker')
      .leftJoinAndSelect('worker.user', 'user')
      .leftJoinAndSelect('worker.bookings', 'booking', 'booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      })
      .where('worker.isActive = :isActive', { isActive: true })
      .getMany();

    return workers.map((worker) => {
      const activeBooking = worker.bookings?.find(
        (b) =>
          b.status === BookingStatus.CONFIRMED ||
          b.status === BookingStatus.IN_PROGRESS,
      );

      return {
        workerId: worker.id,
        workerName: `${worker.user?.firstName || ''} ${worker.user?.lastName || ''}`.trim() || 'Unknown',
        email: worker.user?.email || '',
        phone: worker.user?.phone || '',
        latitude: typeof worker.user?.latitude === 'number' ? worker.user.latitude : 0,
        longitude: typeof worker.user?.longitude === 'number' ? worker.user.longitude : 0,
        isAvailable: worker.isAvailable,
        isActive: worker.isActive,
        rating: typeof worker.rating === 'number' ? worker.rating : 0,
        currentBookingId: activeBooking?.id,
        currentBookingStatus: activeBooking?.status,
      };
    });
  }

  async getActiveBookings(): Promise<ActiveBooking[]> {
    const bookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .leftJoinAndSelect('booking.service', 'service')
      .where('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      })
      .orderBy('booking.date', 'ASC')
      .getMany();

    return bookings.map((booking) => ({
      id: booking.id,
      publicId: (booking as unknown as Record<string, unknown>).publicId as string,
      customerName: `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim() || 'Unknown',
      customerPhone: booking.user?.phone || '',
      workerName: `${booking.worker?.user?.firstName || ''} ${booking.worker?.user?.lastName || ''}`.trim() || 'Unassigned',
      serviceName: booking.service?.name || 'Unknown',
      status: booking.status,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      amount: typeof booking.amount === 'number' ? booking.amount : 0,
      address: booking.user?.address || '',
    }));
  }

  async getBookingTimeline(): Promise<Record<string, unknown>[]> {
    const bookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .leftJoinAndSelect('booking.service', 'service')
      .orderBy('booking.updatedAt', 'DESC')
      .take(50)
      .getMany();

    return bookings.map((booking) => ({
      id: booking.id,
      publicId: (booking as unknown as Record<string, unknown>).publicId as string,
      status: booking.status,
      customerName: `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim() || 'Unknown',
      workerName: `${booking.worker?.user?.firstName || ''} ${booking.worker?.user?.lastName || ''}`.trim() || 'Unassigned',
      serviceName: booking.service?.name || 'Unknown',
      updatedAt: booking.updatedAt,
    }));
  }
}