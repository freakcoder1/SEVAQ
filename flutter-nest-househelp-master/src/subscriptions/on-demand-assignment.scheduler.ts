import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import {
  Booking,
  BookingType,
  BookingStatus,
  AssignmentState,
} from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { Worker } from '../workers/entities/worker.entity';
import { AssignmentsService } from '../assignments/assignments.service';
import { WorkersService } from '../workers/workers.service';
import { NotificationsService } from '../notifications/notifications.service';

// IST timezone offset in milliseconds (UTC+5:30)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

@Injectable()
export class OnDemandAssignmentScheduler {
  private readonly logger = new Logger(OnDemandAssignmentScheduler.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    private readonly assignmentsService: AssignmentsService,
    private readonly workersService: WorkersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get the current time in IST timezone
   */
  private getNowInIST(): Date {
    const now = new Date();
    const istTime = new Date(now.getTime() + IST_OFFSET_MS);
    return istTime;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Main scheduler method that runs every minute
   * Assigns workers to on-demand bookings that don't have workers
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleOnDemandAssignments(): Promise<void> {
    this.logger.log('Running on-demand assignment scheduler...');

    try {
      // Find on-demand bookings that need worker assignment
      // - type is 'on_demand'
      // - status is 'requested' or 'confirmed' (not completed/cancelled)
      // - no worker assigned (workerId is null)
      const bookingsToAssign = await this.bookingRepository.find({
        where: {
          type: BookingType.ON_DEMAND,
          status: In([BookingStatus.REQUESTED, BookingStatus.CONFIRMED]),
          workerId: IsNull(),
        },
        relations: ['service', 'user'],
        take: 100, // Process max 100 at a time to avoid overwhelming the system
      });

      this.logger.log(
        `Found ${bookingsToAssign.length} on-demand bookings needing worker assignment`,
      );

      // Process each booking
      for (const booking of bookingsToAssign) {
        try {
          await this.assignWorkerForBooking(booking);
        } catch (error) {
          this.logger.error(
            `Error assigning worker for on-demand booking ${booking.id}: ${error.message}`,
          );
        }
      }

      // Also handle bookings where assignedWorkerId is set but workerId is not
      // (these might have been assigned but not saved properly)
      const unprocessedBookings = await this.bookingRepository.find({
        where: {
          type: BookingType.ON_DEMAND,
          status: In([BookingStatus.REQUESTED, BookingStatus.CONFIRMED]),
        },
        relations: ['service', 'user'],
        take: 50,
      });

      let additionalAssignments = 0;
      for (const booking of unprocessedBookings) {
        if (!booking.workerId && booking.status === BookingStatus.REQUESTED) {
          try {
            await this.assignWorkerForBooking(booking);
            additionalAssignments++;
          } catch (error) {
            this.logger.error(
              `Error in secondary assignment for booking ${booking.id}: ${error.message}`,
            );
          }
        }
      }

      if (additionalAssignments > 0) {
        this.logger.log(
          `Made ${additionalAssignments} additional worker assignments`,
        );
      }

      this.logger.log('On-demand assignment scheduler completed');
    } catch (error) {
      this.logger.error(
        `Error in on-demand assignment scheduler: ${error.message}`,
      );
    }
  }

  /**
   * Assign a worker to an on-demand booking
   */
  private async assignWorkerForBooking(
    booking: Booking,
  ): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    try {
      // Validate booking has required data
      if (!booking.userId) {
        this.logger.error(`Booking ${booking.id} has no userId`);
        return { success: false, reason: 'Booking has no userId' };
      }

      if (!booking.serviceId) {
        this.logger.error(`Booking ${booking.id} has no serviceId`);
        return { success: false, reason: 'Booking has no serviceId' };
      }

      // Get user's location
      const user = await this.userRepository.findOne({
        where: { publicId: booking.userId },
      });

      if (!user) {
        this.logger.error(`User ${booking.userId} not found for booking ${booking.id}`);
        return { success: false, reason: 'User not found' };
      }

      // Get user's location - prefer preferred location
      let userLat: number;
      let userLng: number;

      if (user.preferredLat && user.preferredLng) {
        userLat = parseFloat(user.preferredLat as unknown as string);
        userLng = parseFloat(user.preferredLng as unknown as string);
      } else if (user.latitude && user.longitude) {
        userLat = parseFloat(user.latitude as unknown as string);
        userLng = parseFloat(user.longitude as unknown as string);
      } else {
        this.logger.warn(
          `No location found for user ${booking.userId} - cannot assign worker`,
        );
        return { success: false, reason: 'No user location available' };
      }

      this.logger.log(
        `Assigning worker for on-demand booking ${booking.id} at location: lat=${userLat}, lng=${userLng}`,
      );

      // Find workers for the service
      const workers = await this.workerRepository
        .createQueryBuilder('worker')
        .leftJoinAndSelect('worker.services', 'service')
        .where('service.id = :serviceId', { serviceId: booking.serviceId })
        .andWhere('worker.isAvailable = :isAvailable', { isAvailable: true })
        .getMany();

      if (workers.length === 0) {
        this.logger.warn(
          `No workers available for service ${booking.serviceId}`,
        );
        return { success: false, reason: 'No workers available for this service' };
      }

      this.logger.log(`Found ${workers.length} workers for service ${booking.serviceId}`);

      // Calculate distance for each worker and sort by nearest
      const workersWithDistance = workers.map((worker) => ({
        worker,
        distance: this.calculateDistance(
          userLat,
          userLng,
          worker.latitude || 0,
          worker.longitude || 0,
        ),
      }));

      // Sort by distance (nearest first)
      workersWithDistance.sort((a, b) => a.distance - b.distance);

      // Log distances
      for (const { worker, distance } of workersWithDistance.slice(0, 5)) {
        this.logger.log(
          `Worker ${worker.id} distance: ${distance.toFixed(2)}km`,
        );
      }

      // Assign the nearest worker
      const nearestWorker = workersWithDistance[0];

      // Update the booking with the worker
      booking.workerId = nearestWorker.worker.id;
      booking.assignedWorkerId = nearestWorker.worker.id;
      booking.assignmentState = AssignmentState.ASSIGNED;

      // If status was requested, update to confirmed
      if (booking.status === BookingStatus.REQUESTED) {
        booking.status = BookingStatus.CONFIRMED;
      }

      await this.bookingRepository.save(booking);

      // Send push notification to worker
      await this._notifyWorkerOfAssignment(nearestWorker.worker, booking);

      this.logger.log(
        `Directly assigned worker ${nearestWorker.worker.id} to on-demand booking ${booking.id} (distance: ${nearestWorker.distance.toFixed(2)}km)`,
      );

      return { success: true, worker: nearestWorker.worker };
    } catch (error) {
      this.logger.error(
        `Error in assignWorkerForBooking for booking ${booking.id}: ${error.message}`,
      );
      return { success: false, reason: error.message };
    }
  }

  /**
   * Send push notification to worker about new booking assignment
   */
  private async _notifyWorkerOfAssignment(worker: Worker, booking: Booking): Promise<void> {
    if (!worker.fcmToken) {
      this.logger.warn(`Worker ${worker.id} has no FCM token, skipping notification`);
      return;
    }

    const service = await this.serviceRepository.findOne({ where: { id: booking.serviceId } });
    const serviceName = service?.name || 'Service';
    const bookingDate = new Date(booking.date).toLocaleDateString('en-IN');

    const title = 'नई बुकिंग मिली! 🎉';
    const body = `${serviceName} - ${bookingDate} को। ग्राहक का पता और विवरण देखने के लिए ऐप खोलें।`;

    await this.notificationsService.sendPushNotification(worker.fcmToken, title, body);
    this.logger.log(`Sent push notification to worker ${worker.id} for booking ${booking.id}`);
  }
}
