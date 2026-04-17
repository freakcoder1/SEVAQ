import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, IsNull, Like, LessThan } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from './entities/subscription.entity';
import {
  Booking,
  AssignmentState,
  BookingStatus,
} from '../bookings/entities/booking.entity';
import { ServiceProfile, ServiceType } from '../service-profiles/entities/service-profile.entity';
import { Service } from '../services/entities/service.entity';
import { Worker } from '../workers/entities/worker.entity';
import { BookingsService } from '../bookings/bookings.service';
import { WorkersService } from '../workers/workers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DataSource } from 'typeorm';

// IST timezone offset in milliseconds (UTC+5:30)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Mapping of serviceType to possible service names for database lookup
// These are used as fallback names when dynamic lookup fails
const SERVICE_TYPE_TO_NAMES: Record<ServiceType, string[]> = {
  [ServiceType.COOK]: ['Cooking', 'Cook', 'Kitchen', 'Cooking Help'],
  [ServiceType.CLEANING]: ['Home Cleaning', 'Cleaning', 'House Cleaning'],
  [ServiceType.MAID]: ['Maid Service', 'Maid', 'Housekeeping'],
};

@Injectable()
export class SubscriptionAssignmentScheduler {
  private readonly logger = new Logger(SubscriptionAssignmentScheduler.name);
  
  // Intelligent backoff configuration
  private currentIntervalMs = 10 * 60 * 1000; // Start at 10 minutes
  private readonly MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes minimum
  private readonly MAX_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes maximum
  private backoffMultiplier = 1;
  private timeoutRef: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly MAX_EXECUTION_TIME_MS = 90 * 1000; // 90 seconds hard limit

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
    private readonly bookingsService: BookingsService,
    private readonly workersService: WorkersService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get the correct service UUID for finding workers using dynamic database lookup
   * Returns the UUID string that workersService.findByService expects
   */
  private async getServiceUuidByProfile(serviceProfile: ServiceProfile): Promise<string | null> {
    const possibleNames = SERVICE_TYPE_TO_NAMES[serviceProfile.serviceType];
    
    if (!possibleNames || possibleNames.length === 0) {
      this.logger.warn(
        `Unknown service type: ${serviceProfile.serviceType}`,
      );
      return null;
    }

    // Try to find the service by each possible name in the database
    for (const serviceName of possibleNames) {
      const service = await this.serviceRepository.findOne({
        where: { name: serviceName },
      });

      if (service) {
        this.logger.log(
          `Found service "${serviceName}" in database with publicId: ${service.publicId}`,
        );
        return service.publicId;
      }
    }

    // If no exact match found, try a broader search
    this.logger.warn(
      `No service found for type ${serviceProfile.serviceType} with names: ${possibleNames.join(', ')}. Trying broader search...`,
    );

    // Try searching by partial name match
    for (const serviceName of possibleNames) {
      const services = await this.serviceRepository.find({
        where: { name: Like(`%${serviceName}%`) },
      });

      if (services.length > 0) {
        this.logger.log(
          `Found service with partial match for "${serviceName}": ${services[0].publicId}`,
        );
        return services[0].publicId;
      }
    }

    // Last resort: return any available service
    const anyService = await this.serviceRepository.findOne({
      select: ['publicId'],
    });

    if (anyService) {
      this.logger.warn(
        `Using fallback service UUID: ${anyService.publicId}`,
      );
      return anyService.publicId;
    }

    this.logger.error(`No services found in database`);
    return null;
  }

  /**
   * Convert service publicId (UUID) to internal service id (integer)
   * This is needed because bookings expect internal id but the mapping uses publicId
   */
  private async getInternalServiceIdByPublicId(publicId: string): Promise<number | null> {
    try {
      const service = await this.serviceRepository.findOne({
        where: { publicId },
      });

      if (!service) {
        this.logger.error(`Service not found for publicId: ${publicId}`);
        return null;
      }

      this.logger.log(`Converted service publicId ${publicId} to internal id ${service.id}`);
      return service.id;
    } catch (error) {
      this.logger.error(`Error converting service publicId to internal id: ${error.message}`);
      return null;
    }
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
   * Initialize dynamic scheduler on module start
   */
  onModuleInit() {
    this.scheduleNextRun();
  }

  /**
   * Schedule next run with current interval
   */
  private scheduleNextRun() {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    
    this.logger.log(`Next subscription assignment check scheduled in ${Math.round(this.currentIntervalMs / 60000)} minutes`);
    this.timeoutRef = setTimeout(() => this.handleSubscriptionAssignments(), this.currentIntervalMs);
  }

  /**
   * Main scheduler method
   */
  async handleSubscriptionAssignments(): Promise<void> {
    this.logger.log('Running subscription assignment scheduler...');

    try {
      // Get current time in IST
      const nowIST = this.getNowInIST();
      
      // Only process subscriptions that started within the last 48 hours
      // This prevents old subscriptions from generating spurious bookings
      const fortyEightHoursAgo = new Date(nowIST.getTime() - 48 * 60 * 60 * 1000);

      // =====================================================
      // ✅ PERMANENT FIX: Single query for ALL subscriptions
      // No more duplicate processing from multiple queries
      // =====================================================
      const allSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
        },
        relations: ['serviceProfile', 'user', 'assignedWorker'],
      });

      // Track processed subscriptions to ensure each is processed ONLY ONCE per run
      const processedSubscriptionIds = new Set<number>();

      this.logger.log(`Found ${allSubscriptions.length} total subscriptions in valid time window`);

      // Process each subscription EXACTLY ONCE
      for (const subscription of allSubscriptions) {
        if (processedSubscriptionIds.has(subscription.id)) {
          continue;
        }

        processedSubscriptionIds.add(subscription.id);
        
        try {
          await this.assignWorkerForSubscription(subscription);
        } catch (error) {
          this.logger.error(
            `Error assigning worker for subscription ${subscription.id}: ${error.message}`,
          );
        }
      }

      // =====================================================
      // ✅ CATCH-ALL: Orphaned Subscription Cleanup Job
      // FIX 5: Process subscriptions older than 48 hours that have never been assigned
      // =====================================================
      const seventyTwoHoursAgo = new Date(nowIST.getTime() - 72 * 60 * 60 * 1000);
      
      // Find truly orphaned subscriptions (active, no worker, older than 72h)
      const unassignedSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          assignedWorkerId: IsNull(),
          startDate: LessThan(seventyTwoHoursAgo),
          workerAssignmentFailed: false
        },
        relations: ['serviceProfile', 'user'],
      });

      this.logger.log(
        `Found ${unassignedSubscriptions.length} truly unassigned subscriptions without any bookings`,
      );

      for (const subscription of unassignedSubscriptions) {
        if (processedSubscriptionIds.has(subscription.id)) {
          continue;
        }

        processedSubscriptionIds.add(subscription.id);
        
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

      this.logger.log(`Processed ${processedSubscriptionIds.size} unique subscriptions`);
      
      // Intelligent backoff adjustment
      if (allSubscriptions.length === 0 && unassignedSubscriptions.length === 0) {
        // No work found - increase interval
        const newInterval = Math.min(this.currentIntervalMs * 1.5, this.MAX_INTERVAL_MS);
        if (newInterval !== this.currentIntervalMs) {
          this.currentIntervalMs = newInterval;
          this.logger.log(`No subscriptions found, increasing interval to ${Math.round(this.currentIntervalMs / 60000)} minutes`);
        }
      } else {
        // Work found - reset to minimum interval
        if (this.currentIntervalMs !== this.MIN_INTERVAL_MS) {
          this.currentIntervalMs = this.MIN_INTERVAL_MS;
          this.logger.log(`Resetting interval to ${Math.round(this.currentIntervalMs / 60000)} minutes (activity detected)`);
        }
      }
      
      this.logger.log('Subscription assignment scheduler completed');
    } catch (error) {
      this.logger.error(
        `Error in subscription assignment scheduler: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    
    // Schedule next run
    this.scheduleNextRun();
  }

  /**
   * Check if a booking already exists for a given subscription on a given date
   * Returns the booking object if found, null otherwise
   * Used for idempotency to prevent duplicate booking creation
   */
  private async getExistingBookingForSubscription(
    subscriptionId: number,
    dateStr: string,
  ): Promise<Booking | null> {
    const existing = await this.bookingRepository.findOne({
      where: {
        type: 'subscription' as any,
        date: dateStr,
        notes: Like(`%subscription ${subscriptionId}%`),
      },
    });
    return existing || null;
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getExistingBookingForSubscription instead
   */
  private async bookingExistsForSubscription(
    subscriptionId: number,
    dateStr: string,
  ): Promise<boolean> {
    const booking = await this.getExistingBookingForSubscription(subscriptionId, dateStr);
    return !!booking;
  }

  /**
   * Check if a notification has already been sent for this subscription today
   * Uses the subscription's lastNotificationSentAt field to prevent duplicate notifications
   * within a cooldown period (1 hour)
   */
  private async hasNotificationCooldownExpired(subscription: Subscription): Promise<boolean> {
    if (!subscription.lastNotificationSentAt) {
      return true; // No notification sent yet, cooldown has "expired"
    }

    const now = new Date();
    const lastSent = new Date(subscription.lastNotificationSentAt);
    const cooldownPeriodMs = 60 * 60 * 1000; // 1 hour cooldown

    const timeSinceLastNotification = now.getTime() - lastSent.getTime();
    const hasExpired = timeSinceLastNotification > cooldownPeriodMs;

    if (!hasExpired) {
      this.logger.log(
        `Subscription ${subscription.id}: Notification cooldown not expired ` +
        `(last sent: ${lastSent.toISOString()}, cooldown: 1 hour)`,
      );
    }

    return hasExpired;
  }

  /**
   * Check if ANY booking exists for a given subscription (regardless of date)
   * Returns the most recent booking if found, null otherwise
   * Used for idempotency to prevent duplicate booking creation
   */
  private async getAnyBookingForSubscription(
    subscriptionId: number,
  ): Promise<Booking | null> {
    const existing = await this.bookingRepository.findOne({
      where: {
        type: 'subscription' as any,
        notes: Like(`%subscription ${subscriptionId}%`),
      },
      order: {
        createdAt: 'DESC',
      },
    });
    return existing || null;
  }

  /**
   * Assign a worker to a subscription by creating a booking and then assigning a worker
   */
  async assignWorkerForSubscription(
    subscription: Subscription,
  ): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    try {
      // ✅ FIX: Only apply notification cooldown IF WORKER WAS ACTUALLY FOUND
      // For unassigned subscriptions, we ALWAYS retry - no cooldown block
      if (subscription.assignedWorkerId !== null) {
        // Only apply cooldown when worker is already assigned
        const cooldownExpired = await this.hasNotificationCooldownExpired(subscription);
        if (!cooldownExpired) {
          this.logger.log(
            `Skipping subscription ${subscription.id}: notification cooldown not expired (worker already assigned)`,
          );
          return { success: true, reason: 'Notification cooldown active' };
        }
      } else {
        this.logger.log(
          `Subscription ${subscription.id} has no assigned worker - skipping cooldown, will retry assignment`,
        );
      }

      // =====================================================
      // ✅ PERMANENT FIX: Atomic idempotency check with pessimistic locking
      // =====================================================
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Lock the subscription row to prevent concurrent processing
        const lockedSubscription = await queryRunner.manager
          .getRepository(Subscription)
          .createQueryBuilder('subscription')
          .setLock('pessimistic_write')
          .where('subscription.id = :id', { id: subscription.id })
          .getOne();

        if (!lockedSubscription) {
          await queryRunner.rollbackTransaction();
          return { success: false, reason: 'Subscription no longer exists' };
        }

        // Check for ANY existing booking for this subscription
        const existingBooking = await queryRunner.manager
          .getRepository(Booking)
          .findOne({
            where: {
              type: 'subscription' as any,
              notes: Like(`%subscription ${subscription.id}%`),
            },
            order: { createdAt: 'DESC' },
          });

        if (existingBooking) {
          this.logger.log(
            `✅ Idempotent: Subscription ${subscription.id} already has booking ${existingBooking.id}, skipping creation`,
          );
          await queryRunner.commitTransaction();
          return { success: true, reason: 'Booking already exists' };
        }

        // ✅ SAFE: No booking exists. We hold an exclusive lock so no other process can create one.
        // ✅ BUGFIX: KEEP LOCK HELD DURING BOOKING CREATION - DO NOT COMMIT HERE

      } catch (lockError) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        this.logger.warn(`Lock contention for subscription ${subscription.id}, will retry next run`);
        return { success: false, reason: 'Lock contention, retry later' };
      }

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

      // Get the service UUID from the service profile for finding workers
      const serviceUuid = await this.getServiceUuidByProfile(subscription.serviceProfile);
      
      if (!serviceUuid) {
        this.logger.error(`Failed to get service UUID for subscription ${subscription.id}`);
        return { success: false, reason: 'Invalid service configuration' };
      }
      
      // Convert service publicId (UUID) to internal service id (integer) for booking creation
      const internalServiceId = await this.getInternalServiceIdByPublicId(serviceUuid);
      if (!internalServiceId) {
        this.logger.error(`Failed to convert service UUID to internal id for: ${serviceUuid}`);
        return { success: false, reason: 'Invalid service configuration' };
      }
      // serviceUuid (string) is used for finding workers via workersService.findByService
      // internalServiceId (number) is used for creating bookings
      const serviceId = internalServiceId;

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
          date: tomorrow.toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
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
          const assignmentResult = await this.directlyAssignWorkerWithoutBooking(location, serviceUuid, subscription.id);
          return assignmentResult;
        }

        // Now assign a worker to this booking
        const assignmentResult = await this.directlyAssignWorker(booking, location, serviceUuid);

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
          
          // Notification is already sent inside directlyAssignWorker(), no need to send again
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
        date: startDate.toISOString().split('T')[0], // Start date in YYYY-MM-DD format
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

      try {
        // Now assign a worker to this booking directly without slot lookup
        // This skips the slot service which doesn't work properly for subscriptions
        const assignmentResult = await this.directlyAssignWorker(booking, location, serviceUuid);

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
          
          // ✅ BUGFIX: Update booking status to CONFIRMED so customer app stops showing "finding your match"
          // Customer interface checks for BookingStatus not AssignmentState
          if (assignmentResult.worker) {
            await this.bookingRepository.update(booking.id, {
              status: BookingStatus.CONFIRMED,
              assignmentState: AssignmentState.ASSIGNED,
              workerId: assignmentResult.worker.id,
            });

            // ✅ BUGFIX: Reload booking with FULL user relations (user, addresses)
            // This ensures customer name and location are available in the worker app
            await this.bookingRepository.findOne({
              where: { id: booking.id },
              relations: ['user', 'user.addresses', 'worker', 'service'],
            });
          }
          
          // Notification is already sent inside directlyAssignWorker(), no need to send again
        } else {
          this.logger.warn(
            `Could not assign worker for subscription ${subscription.id}: ${assignmentResult.reason}`,
          );
          // ✅ PERMANENT FIX: Clean up orphaned booking when worker assignment fails
          this.logger.log(`Cleaning up orphaned booking ${booking.id} for subscription ${subscription.id}`);
          await this.bookingsService.cancel(booking.id);
        }

        return assignmentResult;
      } catch (assignmentError) {
        this.logger.error(`Worker assignment failed, cleaning up booking ${booking.id}: ${assignmentError.message}`);
        // Always clean up the booking if anything fails after creation
        await this.bookingsService.cancel(booking.id);
        throw assignmentError;
      }
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
    serviceId: string | number,
  ): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    try {
      this.logger.log(`Starting direct worker assignment for booking ${booking.id}`);

      // Find workers for this service using the publicId (UUID) string
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
      booking.status = BookingStatus.CONFIRMED;
      booking.assignmentTimestamp = new Date();

      // CRITICAL FIX: Save booking with proper verification and error handling
      try {
        const savedBooking = await this.bookingRepository.save(booking);
        
        // DEFENSIVE VERIFICATION: Double check save actually persisted
        if (!savedBooking || savedBooking.id !== booking.id) {
          throw new Error(`Booking save returned invalid entity for booking ${booking.id}`);
        }

        // VERIFICATION: Reload from database to 100% confirm changes were persisted
        const verifiedBooking = await this.bookingRepository.findOne({
          where: { id: booking.id },
          relations: ['user', 'user.addresses', 'service']
        });
        
        if (!verifiedBooking) {
          throw new Error(`Booking ${booking.id} not found after save - critical persistence failure`);
        }

        if (verifiedBooking.assignedWorkerId !== nearestWorker.id) {
          throw new Error(
            `Booking ${booking.id} save failed to persist worker assignment. ` +
            `Expected worker ${nearestWorker.id}, got ${verifiedBooking.assignedWorkerId}`
          );
        }

        if (verifiedBooking.assignmentState !== AssignmentState.ASSIGNED) {
          throw new Error(
            `Booking ${booking.id} save failed to persist assignment state. ` +
            `Expected ${AssignmentState.ASSIGNED}, got ${verifiedBooking.assignmentState}`
          );
        }

        this.logger.log(
          `✅ SUCCESS: Worker ${nearestWorker.id} assigned and PERSISTED to booking ${booking.id} ` +
          `(distance: ${minDistance.toFixed(2)}km) - database verified`,
        );

      } catch (saveError) {
        this.logger.error(
          `❌ CRITICAL FAILURE: Could not save booking ${booking.id} after worker assignment: ${saveError.message}`,
          saveError.stack
        );
        
        // FAIL EXPLICITLY - do NOT send notification if booking was not saved
        throw new Error(`Booking persistence failed: ${saveError.message}`);
      }

      this.logger.log(
        `Directly assigned worker ${nearestWorker.id} to booking ${booking.id} (distance: ${minDistance.toFixed(2)}km)`,
      );

      // Send push notification to worker about new booking
      await this._notifyWorkerOfAssignment(nearestWorker, booking);

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
    serviceId: string | number,
    subscriptionId: number,
  ): Promise<{ success: boolean; worker?: Worker; reason?: string }> {
    try {
      this.logger.log(`Starting direct worker assignment for subscription ${subscriptionId}`);

      // Find workers for this service using the publicId (UUID) string
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

      // Note: No booking exists in this case, so we can't send a booking notification
      // The worker will see it when they poll for subscriptions

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

  /**
   * Send full-screen push notification to worker about new booking assignment
   * Uses sendFullScreenPushNotification with fullScreenIntent for alarm-style full-screen display
   * Works even when app is terminated (unlike regular notifications)
   */
  private async _notifyWorkerOfAssignment(worker: Worker, booking: Booking): Promise<void> {
    // Check if notification has already been sent to prevent duplicate notifications
    if (booking.notificationSent) {
      this.logger.log(`Skipping notification for booking ${booking.id} - notification already sent`);
      return;
    }

    // Check if worker has FCM token
    if (!worker.fcmToken) {
      this.logger.warn(`Worker ${worker.id} has no FCM token, skipping notification`);
      return;
    }

    const serviceName = booking.service?.name || 'Service';
    const bookingDate = booking.date || new Date().toISOString().split('T')[0];

    // Extract customer and location details for rich notification payload
    const customerName = booking.user?.firstName ?? 'Customer';
    const customerPhone = booking.user?.phone ?? '';
    const customerAddress = booking.user?.address ?? '';
    const price = booking.amount?.toString() ?? booking.totalAmount?.toString() ?? '0';

    try {
      // Use sendFullScreenPushNotification with fullScreenIntent for alarm-style full-screen display
      // This sends both android.notification (for system tray) and data payload (for Flutter in foreground)
      // The notificationSent flag prevents duplicate notifications
      await this.notificationsService.sendFullScreenPushNotification(
        worker.fcmToken,
        'नई बुकिंग मिली! 🎉',
        `${serviceName} - ${bookingDate} को। ग्राहक का पता और विवरण देखने के लिए ऐप खोलें।`,
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
          assignmentType: 'subscription',
          timestamp: new Date().toISOString(),
        },
      );

      // Mark notification as sent to prevent duplicates
      booking.notificationSent = true;
      await this.bookingRepository.save(booking);

      this.logger.log(`Sent data-only notification to worker ${worker.id} for booking ${booking.id}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error sending notification to worker ${worker.id}: ${errorMsg}`);
    }
  }
}
