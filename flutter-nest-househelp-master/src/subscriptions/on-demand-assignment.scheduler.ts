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
  private isRunning = false;

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
    if (this.isRunning) {
      this.logger.warn('Previous on-demand assignment run still in progress, skipping...');
      return;
    }

    this.isRunning = true;
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
        take: 25, // Process max 25 at a time to avoid overwhelming the connection pool
      });

      this.logger.log(
        `Found ${bookingsToAssign.length} on-demand bookings needing worker assignment`,
      );

      // Process each booking and track outcomes
      let successfulAssignments = 0;
      let failedAssignments = 0;
      for (const booking of bookingsToAssign) {
        try {
          const result = await this.assignWorkerForBooking(booking);
          if (result.success) {
            successfulAssignments++;
          } else {
            failedAssignments++;
          }
        } catch (error) {
          failedAssignments++;
          this.logger.error(
            `Error assigning worker for on-demand booking ${booking.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `On-demand assignment scheduler completed: ${successfulAssignments} assigned, ${failedAssignments} failed out of ${bookingsToAssign.length} bookings`,
      );
    } catch (error) {
      this.logger.error(
        `Error in on-demand assignment scheduler: ${error.message}`,
      );
    } finally {
      this.isRunning = false;
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

      // Get user from the already-loaded relation (booking.user is loaded via relations: ['user'])
      // Fall back to querying by numeric id only if relation isn't loaded
      let user: User | null = booking.user;

      if (!user) {
        this.logger.log(`User relation not loaded for booking ${booking.id}, querying by numeric id...`);
        // booking.userId may be numeric (internal id) or UUID (publicId)
        // Try to detect which format it is
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(booking.userId);
        
        if (isUUID) {
          user = await this.userRepository.findOne({
            where: { publicId: booking.userId },
          });
        } else {
          // Numeric internal id - query by id column
          const numericId = parseInt(booking.userId, 10);
          if (!isNaN(numericId)) {
            user = await this.userRepository.findOne({
              where: { id: numericId },
            });
          }
        }
      }

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
   * Only sends notification if payment is complete (isPaid = true)
   */
  private async _notifyWorkerOfAssignment(worker: Worker, booking: Booking): Promise<void> {
    // Check if notification has already been sent to prevent duplicate notifications
    if (booking.notificationSent) {
      this.logger.log(`Skipping notification for on-demand booking ${booking.id} - notification already sent`);
      return;
    }

    // Check if payment is complete before notifying worker
    if (!booking.isPaid) {
      this.logger.log(`Skipping notification for on-demand booking ${booking.id} - payment not complete (isPaid: ${booking.isPaid})`);
      return;
    }

    if (!worker.fcmToken) {
      this.logger.warn(`Worker ${worker.id} has no FCM token, skipping notification`);
      return;
    }

    const service = await this.serviceRepository.findOne({ where: { id: booking.serviceId } });
    const serviceName = service?.name || 'Service';
    const bookingDate = new Date(booking.date).toLocaleDateString('en-IN');

    const title = 'नई बुकिंग मिली! 🎉';
    const body = `${serviceName} - ${bookingDate} को। ग्राहक का पता और विवरण देखने के लिए ऐप खोलें।`;

    // Extract customer and location details for rich notification payload
    const customerName = booking.user?.firstName ?? 'Customer';
    const customerPhone = booking.user?.phone ?? '';
    const customerAddress = booking.user?.address ?? '';
    const price = booking.amount?.toString() ?? booking.totalAmount?.toString() ?? '0';

    // Use push notification with both android.notification (for sound in background/terminated)
    // and data payload (for Flutter to show in-app dialog in foreground)
    // The notificationSent flag prevents duplicate notifications
    await this.notificationsService.sendPushNotification(
      worker.fcmToken,
      title,
      body,
      {
        type: 'new_booking',
        bookingId: booking.id.toString(),
        serviceName,
        serviceDate: bookingDate,
        startTime: booking.startTime ?? '',
        endTime: booking.endTime ?? '',
        customerName,
        customerPhone,
        customerAddress,
        price,
        assignmentType: 'on_demand',
        timestamp: new Date().toISOString(),
      },
    );

    // Mark notification as sent to prevent duplicates
    booking.notificationSent = true;
    await this.bookingRepository.save(booking);

    this.logger.log(`Sent data-only notification to worker ${worker.id} for booking ${booking.id}`);
  }
}
