import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, IsNull } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from './entities/subscription.entity';
import {
  Booking,
  AssignmentState,
} from '../bookings/entities/booking.entity';
import { ServiceProfile, ServiceType } from '../service-profiles/entities/service-profile.entity';
import { Service } from '../services/entities/service.entity';
import { Worker } from '../workers/entities/worker.entity';
import { AssignmentsService } from '../assignments/assignments.service';
import { BookingsService } from '../bookings/bookings.service';
import { WorkersService } from '../workers/workers.service';

// IST timezone offset in milliseconds (UTC+5:30)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Mapping of serviceType to service.name for finding the correct service ID
const SERVICE_TYPE_TO_NAME: Record<ServiceType, string> = {
  [ServiceType.COOK]: 'Cooking',
  [ServiceType.CLEANING]: 'Home Cleaning',
  [ServiceType.MAID]: 'Maid Service',
};

@Injectable()
export class SubscriptionAssignmentScheduler {
  private readonly logger = new Logger(SubscriptionAssignmentScheduler.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(ServiceProfile)
    private readonly serviceProfileRepository: Repository<ServiceProfile>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    private readonly assignmentsService: AssignmentsService,
    private readonly bookingsService: BookingsService,
    private readonly workersService: WorkersService,
  ) {}

  /**
   * Get the correct service ID for booking creation based on the service profile's serviceType
   * This maps service profiles (COOK, CLEANING, MAID) to actual service IDs
   */
  private async getServiceIdByProfile(
    serviceProfile: ServiceProfile,
  ): Promise<number> {
    const serviceName = SERVICE_TYPE_TO_NAME[serviceProfile.serviceType];
    if (!serviceName) {
      this.logger.warn(
        `Unknown service type: ${serviceProfile.serviceType}, using default service ID 1`,
      );
      return 1;
    }

    const service = await this.serviceRepository.findOne({
      where: { name: serviceName },
    });

    if (!service) {
      this.logger.warn(
        `Service not found for name: ${serviceName}, using default service ID 1`,
      );
      return 1;
    }

    return service.id;
  }

  /**
   * Get the current time in IST timezone
   */
  private getNowInIST(): Date {
    const now = new Date();
    return new Date(now.getTime() + IST_OFFSET_MS);
  }

  /**
   * Calculate distance between two points using Haversine formula
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
   * Get start time for a time window preference
   */
  private getStartTimeForTimeWindow(
    timeWindow: string,
    date: Date,
  ): string {
    let hour = 8; // Default to 8 AM
    switch (timeWindow.toLowerCase()) {
      case 'morning':
        hour = 8;
        break;
      case 'afternoon':
        hour = 12;
        break;
      case 'evening':
        hour = 16;
        break;
      case 'early-morning':
        hour = 6;
        break;
      default:
        hour = 8;
    }
    return `${hour.toString().padStart(2, '0')}:00:00`;
  }

  /**
   * Get end time for a time window preference
   */
  private getEndTimeForTimeWindow(
    timeWindow: string,
    date: Date,
  ): string {
    let hour = 12; // Default to 12 PM
    switch (timeWindow.toLowerCase()) {
      case 'morning':
        hour = 12;
        break;
      case 'afternoon':
        hour = 17;
        break;
      case 'evening':
        hour = 21;
        break;
      case 'early-morning':
        hour = 11;
        break;
      default:
        hour = 12;
    }
    return `${hour.toString().padStart(2, '0')}:00:00`;
  }

  /**
   * Main scheduler method that runs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleSubscriptionAssignments(): Promise<void> {
    this.logger.log('Running subscription assignment scheduler...');

    try {
      // Get current time in IST
      const nowIST = this.getNowInIST();

      // Find subscriptions that need immediate assignment (starting today or earlier)
      const subscriptionsToAssign =
        await this.subscriptionRepository.find({
          where: {
            status: SubscriptionStatus.ACTIVE,
            startDate: Between(new Date(0), nowIST), // Start date is today or in the past
          },
          relations: ['serviceProfile', 'user'],
        });

      this.logger.log(
        `Found ${subscriptionsToAssign.length} subscriptions needing immediate assignment (starting today)`,
      );

      // Process each subscription
      for (const subscription of subscriptionsToAssign) {
        try {
          await this.assignWorkerForSubscription(subscription);
        } catch (error) {
          this.logger.error(
            `Error assigning worker for subscription ${subscription.id}: ${error.message}`,
          );
        }
      }

      // Find subscriptions that need pre-start assignment (starting within the next 0-24 hours)
      const twentyFourHoursFromNow = new Date(
        nowIST.getTime() + 24 * 60 * 60 * 1000,
      );

      const preStartSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          startDate: Between(nowIST, twentyFourHoursFromNow),
        },
        relations: ['serviceProfile', 'user'],
      });

      this.logger.log(
        `Found ${preStartSubscriptions.length} subscriptions needing pre-start assignment (0-24h window)`,
      );

      for (const subscription of preStartSubscriptions) {
        try {
          // Assign workers for subscriptions starting soon
          await this.assignWorkerForSubscription(subscription);
        } catch (error) {
          this.logger.error(
            `Error assigning worker for subscription ${subscription.id}: ${error.message}`,
          );
        }
      }

      // Find subscriptions that need just-in-time assignment (starting in 24-48 hours)
      const fortyEightHoursFromNow = new Date(
        nowIST.getTime() + 48 * 60 * 60 * 1000,
      );

      const upcomingSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          startDate: Between(twentyFourHoursFromNow, fortyEightHoursFromNow),
        },
        relations: ['serviceProfile', 'user'],
      });

      this.logger.log(
        `Found ${upcomingSubscriptions.length} subscriptions needing just-in-time assignment (24-48h window)`,
      );

      for (const subscription of upcomingSubscriptions) {
        try {
          // Pre-assign workers for upcoming subscriptions
          await this.assignWorkerForSubscription(subscription);
        } catch (error) {
          this.logger.error(
            `Error pre-assigning worker for subscription ${subscription.id}: ${error.message}`,
          );
        }
      }

      // =====================================================
      // CATCH-ALL: Assign workers to ANY active subscription without a worker
      // This ensures all active subscriptions get workers regardless of start date
      // =====================================================
      const unassignedSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          assignedWorkerId: IsNull(),
        },
        relations: ['serviceProfile', 'user'],
      });

      this.logger.log(
        `Found ${unassignedSubscriptions.length} active subscriptions without assigned workers (catch-all)`,
      );

      for (const subscription of unassignedSubscriptions) {
        try {
          this.logger.log(
            `Assigning worker to subscription ${subscription.id} (startDate: ${subscription.startDate}) - catch-all assignment`,
          );
          await this.assignWorkerForSubscription(subscription);
        } catch (error) {
          this.logger.error(
            `Error assigning worker for subscription ${subscription.id} (catch-all): ${error.message}`,
          );
        }
      }

      this.logger.log('Subscription assignment scheduler completed');
    } catch (error) {
      this.logger.error(
        `Error in subscription assignment scheduler: ${error.message}`,
      );
    }
  }

  /**
   * Assign a worker to a subscription by creating a booking and then assigning a worker
   */
  async assignWorkerForSubscription(
    subscription: Subscription,
  ): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    try {
      // Validate subscription has required data
      if (!subscription.userId) {
        this.logger.error(`Subscription ${subscription.id} has no userId`);
        return { success: false, reason: 'Subscription has no userId' };
      }

      if (!subscription.serviceProfile) {
        this.logger.error(
          `Subscription ${subscription.id} has no serviceProfile relation loaded`,
        );
        return {
          success: false,
          reason: 'Subscription has no serviceProfile relation',
        };
      }

      // Get the service ID from the service profile
      const serviceId = await this.getServiceIdByProfile(subscription.serviceProfile);

      // Get user's location from subscription - prioritize subscription location,
      // then user's preferred location, then user's regular location
      const getUserLocation = (): { lat: number; lng: number } | null => {
        // First check if subscription has a location set
        if (subscription.location && subscription.location.lat && subscription.location.lng) {
          this.logger.log(
            `Using subscription location: lat=${subscription.location.lat}, lng=${subscription.location.lng}`,
          );
          return { lat: subscription.location.lat, lng: subscription.location.lng };
        }

        // Fall back to user's location if user relation is loaded
        if (subscription.user) {
          // Prefer preferredLat/preferredLng if available
          if (subscription.user.preferredLat && subscription.user.preferredLng) {
            this.logger.log(
              `Using user's preferred location: lat=${subscription.user.preferredLat}, lng=${subscription.user.preferredLng}`,
            );
            return {
              lat: parseFloat(subscription.user.preferredLat as unknown as string),
              lng: parseFloat(subscription.user.preferredLng as unknown as string),
            };
          }
          // Fall back to regular latitude/longitude
          if (subscription.user.latitude && subscription.user.longitude) {
            this.logger.log(
              `Using user's location: lat=${subscription.user.latitude}, lng=${subscription.user.longitude}`,
            );
            return {
              lat: parseFloat(subscription.user.latitude as unknown as string),
              lng: parseFloat(subscription.user.longitude as unknown as string),
            };
          }
        }

        this.logger.warn(
          `No location found for subscription ${subscription.id} - user may not have completed location setup`,
        );
        return null;
      };

      const location = getUserLocation();

      if (!location) {
        return { success: false, reason: 'No location found for user' };
      }

      // Check if the proposed time window has already passed for today
      // If the subscription starts today and the time window is in the past, skip booking creation
      const nowIST = this.getNowInIST();
      const startDate = new Date(subscription.startDate);

      this.logger.log(
        `Assigning primary worker for subscription ${subscription.id} ` +
          `(starts: ${startDate.toISOString()})`,
      );

      const proposedTime = this.getStartTimeForTimeWindow(
        subscription.preferredTimeWindow,
        startDate,
      );

      // Parse the proposed time
      const [proposedHour] = proposedTime.split(':').map(Number);
      const proposedDateTime = new Date(startDate);
      proposedDateTime.setHours(proposedHour, 0, 0, 0);

      // If the proposed time has already passed today, skip booking creation for today
      // BUT still assign a worker so the frontend can show the worker's name
      // The scheduler will create a booking for tomorrow
      if (
        proposedDateTime.getTime() < nowIST.getTime() &&
        startDate.toDateString() === nowIST.toDateString()
      ) {
        this.logger.log(
          `Proposed start time ${proposedTime} is in the past (current: ${nowIST.toTimeString().slice(0, 5)}), skipping booking creation for today but still assigning worker`,
        );
        
        // Even if we're skipping booking creation, we should still assign a worker
        // to the subscription so the frontend can show the worker's name
        // Use tomorrow's date for the booking if needed
        const tomorrow = new Date(nowIST);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const bookingData = {
          serviceId,
          startTime: this.getStartTimeForTimeWindow(
            subscription.preferredTimeWindow,
            tomorrow,
          ),
          endTime: this.getEndTimeForTimeWindow(
            subscription.preferredTimeWindow,
            tomorrow,
          ),
          userId: subscription.userId,
          notes: `Initial booking for subscription ${subscription.id}`,
          type: 'subscription',
        };

        // Create the booking for tomorrow
        const booking = await this.bookingsService.create(bookingData);

        if (!booking || !booking.id) {
          // If booking creation fails, try to assign worker directly anyway
          const assignmentResult = await this.directlyAssignWorkerWithoutBooking(location, serviceId, subscription.id);
          return assignmentResult;
        }

        // Now assign a worker to this booking
        const assignmentResult = await this.directlyAssignWorker(booking, location, serviceId);

        if (assignmentResult.success) {
          this.logger.log(
            `Successfully assigned worker ${assignmentResult.worker?.id} ` +
              `for subscription ${subscription.id}`,
          );
          // Update the subscription's assignedWorkerId so the frontend can show the worker's name
          if (assignmentResult.worker && subscription.assignedWorkerId !== assignmentResult.worker.id) {
            subscription.assignedWorkerId = assignmentResult.worker.id;
            await this.subscriptionRepository.save(subscription);
            this.logger.log(
              `Updated subscription ${subscription.id} with assigned worker ${assignmentResult.worker.id}`,
            );
          }
          // Reset workerAssignmentFailed since worker was successfully assigned
          subscription.workerAssignmentFailed = false;
          await this.subscriptionRepository.save(subscription);
        } else {
          this.logger.warn(
            `Could not assign worker for subscription ${subscription.id}: ${assignmentResult.reason}`,
          );
          // Set workerAssignmentFailed to true since worker assignment failed
          subscription.workerAssignmentFailed = true;
          await this.subscriptionRepository.save(subscription);
        }

        return assignmentResult;
      }

      // Create booking data
      const bookingData = {
        serviceId,
        startTime: this.getStartTimeForTimeWindow(
          subscription.preferredTimeWindow,
          startDate,
        ),
        endTime: this.getEndTimeForTimeWindow(
          subscription.preferredTimeWindow,
          startDate,
        ),
        userId: subscription.userId,
        notes: `Initial booking for subscription ${subscription.id}`,
        type: 'subscription',
      };

      // Create the booking
      const booking = await this.bookingsService.create(bookingData);

      if (!booking || !booking.id) {
        this.logger.error(
          `Failed to create booking for subscription ${subscription.id}`,
        );
        return { success: false, reason: 'Failed to create booking' };
      }

      // Now assign a worker to this booking directly without slot lookup
      // This skips the slot service which doesn't work properly for subscriptions
      const assignmentResult = await this.directlyAssignWorker(booking, location, serviceId);

      if (assignmentResult.success) {
        this.logger.log(
          `Successfully assigned worker ${assignmentResult.worker?.id} ` +
            `for subscription ${subscription.id}`,
        );
        // Update the subscription's assignedWorkerId so the frontend can show the worker's name
        if (assignmentResult.worker && subscription.assignedWorkerId !== assignmentResult.worker.id) {
          subscription.assignedWorkerId = assignmentResult.worker.id;
          await this.subscriptionRepository.save(subscription);
          this.logger.log(
            `Updated subscription ${subscription.id} with assigned worker ${assignmentResult.worker.id}`,
          );
        }
      } else {
        this.logger.warn(
          `Could not assign worker for subscription ${subscription.id}: ${assignmentResult.reason}`,
        );
      }

      return assignmentResult;
    } catch (error) {
      this.logger.error(
        `Error assigning worker for subscription ${subscription.id}: ${error.message}`,
      );
      return { success: false, reason: error.message };
    }
  }

  /**
   * Directly assign the nearest available worker to a booking without requiring slot lookup
   * This is used for subscription bookings where slots are not required
   */
  async directlyAssignWorker(
    booking: Booking,
    location: { lat: number; lng: number },
    serviceId: number,
  ): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    try {
      this.logger.log(`Starting direct worker assignment for booking ${booking.id}`);

      // Find workers for this service using the correct method
      const workers = await this.workersService.findByService(serviceId.toString());

      if (!workers || workers.length === 0) {
        this.logger.warn(`No workers found for service ${serviceId}`);
        return { success: false, reason: 'No workers available for this service' };
      }

      this.logger.log(`Found ${workers.length} workers for service ${serviceId}`);

      // Find the nearest worker
      let nearestWorker: Worker | null = null;
      let minDistance = Infinity;

      for (const worker of workers) {
        // Calculate distance between user and worker
        const distance = this.calculateDistance(
          location.lat,
          location.lng,
          parseFloat(worker.latitude as unknown as string),
          parseFloat(worker.longitude as unknown as string),
        );

        this.logger.log(`Worker ${worker.id} distance: ${distance.toFixed(2)}km`);

        if (distance < minDistance) {
          minDistance = distance;
          nearestWorker = worker;
        }
      }

      if (!nearestWorker) {
        this.logger.warn('No suitable worker found');
        return { success: false, reason: 'No suitable worker found' };
      }

      // Assign the worker to the booking
      booking.worker = nearestWorker;
      booking.assignedWorkerId = nearestWorker.id;
      booking.assignmentState = AssignmentState.ASSIGNED;
      await this.bookingRepository.save(booking);

      this.logger.log(
        `Directly assigned worker ${nearestWorker.id} to booking ${booking.id} (distance: ${minDistance.toFixed(2)}km)`,
      );

      return { success: true, worker: nearestWorker };
    } catch (error) {
      this.logger.error(`Error in direct worker assignment: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Assign the nearest available worker directly to a subscription without requiring a booking
   * This is used when the time slot has passed and we just need to assign a worker
   */
  async directlyAssignWorkerWithoutBooking(
    location: { lat: number; lng: number },
    serviceId: number,
    subscriptionId: number,
  ): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    try {
      this.logger.log(`Starting direct worker assignment for subscription ${subscriptionId}`);

      // Find workers for this service
      const workers = await this.workersService.findByService(serviceId.toString());

      if (!workers || workers.length === 0) {
        this.logger.warn(`No workers found for service ${serviceId}`);
        return { success: false, reason: 'No workers available for this service' };
      }

      this.logger.log(`Found ${workers.length} workers for service ${serviceId}`);

      // Find the nearest worker
      let nearestWorker: Worker | null = null;
      let minDistance = Infinity;

      for (const worker of workers) {
        // Calculate distance between user and worker
        const distance = this.calculateDistance(
          location.lat,
          location.lng,
          parseFloat(worker.latitude as unknown as string),
          parseFloat(worker.longitude as unknown as string),
        );

        this.logger.log(`Worker ${worker.id} distance: ${distance.toFixed(2)}km`);

        if (distance < minDistance) {
          minDistance = distance;
          nearestWorker = worker;
        }
      }

      if (!nearestWorker) {
        this.logger.warn('No suitable worker found');
        return { success: false, reason: 'No suitable worker found' };
      }

      // Update the subscription's assignedWorkerId
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId },
      });

      if (subscription) {
        subscription.assignedWorkerId = nearestWorker.id;
        await this.subscriptionRepository.save(subscription);
        this.logger.log(`Updated subscription ${subscriptionId} with assignedWorkerId ${nearestWorker.id}`);
      }

      this.logger.log(
        `Directly assigned worker ${nearestWorker.id} to subscription ${subscriptionId} (distance: ${minDistance.toFixed(2)}km)`,
      );

      return { success: true, worker: nearestWorker };
    } catch (error) {
      this.logger.error(`Error in direct worker assignment without booking: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Manual trigger for assigning workers for a specific subscription
   * Useful for testing or manual assignment
   */
  async assignForSubscription(subscriptionId: number) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['serviceProfile', 'user'],
    });

    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new Error(`Subscription ${subscriptionId} is not active`);
    }

    return this.assignWorkerForSubscription(subscription);
  }

  /**
   * Get subscriptions that are ready for assignment (24-48h window)
   */
  async getSubscriptionsReadyForAssignment() {
    const nowIST = this.getNowInIST();
    const twentyFourHoursFromNow = new Date(
      nowIST.getTime() + 24 * 60 * 60 * 1000,
    );
    const fortyEightHoursFromNow = new Date(
      nowIST.getTime() + 48 * 60 * 60 * 1000,
    );

    return this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        startDate: Between(twentyFourHoursFromNow, fortyEightHoursFromNow),
      },
      relations: ['serviceProfile', 'user'],
    });
  }
}
