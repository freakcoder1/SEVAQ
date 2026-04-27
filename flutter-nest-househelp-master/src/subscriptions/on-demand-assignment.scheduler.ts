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
import { WorkersService } from '../workers/workers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionWorkerSyncService } from '../subscriptions/subscription-worker-sync.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { ServiceProfile } from '../service-profiles/entities/service-profile.entity';

// IST timezone offset in milliseconds (UTC+5:30)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

@Injectable()
export class OnDemandAssignmentScheduler {
  private readonly logger = new Logger(OnDemandAssignmentScheduler.name);
  private isRunning = false;
  private idleCounter = 0;
  private currentIntervalMs = 60 * 1000; // Start with 1 minute
  
  private readonly BACKOFF_LEVELS = [
    60 * 1000,   // 1 minute
    2 * 60 * 1000, // 2 minutes
    5 * 60 * 1000, // 5 minutes
    15 * 60 * 1000, // 15 minutes
    30 * 60 * 1000, // 30 minutes (max)
  ];

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(ServiceProfile)
    private readonly serviceProfileRepository: Repository<ServiceProfile>,
    private readonly workersService: WorkersService,
    private readonly notificationsService: NotificationsService,
    private readonly subscriptionWorkerSyncService: SubscriptionWorkerSyncService,
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

   private timeoutRef: NodeJS.Timeout | null = null;
   private readonly MAX_EXECUTION_TIME_MS = 45 * 1000; // 45 seconds hard limit

   onModuleInit() {
     this.scheduleNextRun();
   }

   onModuleDestroy() {
     if (this.timeoutRef) {
       clearTimeout(this.timeoutRef);
     }
   }

   private scheduleNextRun() {
     if (this.timeoutRef) {
       clearTimeout(this.timeoutRef);
     }
     
     this.logger.log(`Next on-demand assignment check scheduled in ${Math.round(this.currentIntervalMs / 60000)} minutes`);
     this.timeoutRef = setTimeout(() => this.handleOnDemandAssignments(), this.currentIntervalMs);
   }

   /**
    * Main scheduler method with proper timeout safety
    * Assigns workers to on-demand bookings that don't have workers
    */
   async handleOnDemandAssignments(): Promise<void> {
     if (this.isRunning) {
       this.logger.warn('Previous on-demand assignment run still in progress, skipping...');
       this.scheduleNextRun();
       return;
     }

     this.isRunning = true;
     this.logger.log('Running on-demand assignment scheduler...');

     // ✅ GUARANTEED RESET: Hard timeout that will ALWAYS reset isRunning even if everything else fails
     const hardResetTimeout = setTimeout(() => {
       this.logger.error('⚠️ ON-DEMAND SCHEDULER HARD TIMEOUT TRIGGERED - FORCING RESET');
       this.isRunning = false;
       this.idleCounter = Math.min(this.idleCounter + 1, this.BACKOFF_LEVELS.length - 1);
       this.currentIntervalMs = this.BACKOFF_LEVELS[this.idleCounter];
       this.scheduleNextRun();
     }, this.MAX_EXECUTION_TIME_MS);

      try {
        // Ensure "Cooking" service exists (added for production fix)
        try {
          const cookingService = await this.serviceRepository.findOne({
            where: { name: 'Cooking Service', category: 'Cooking' }
          });
          if (!cookingService) {
            this.logger.log('Cooking Service missing, adding it...');
            const newService = this.serviceRepository.create({
              publicId: '7f8e4b5c-a883-4c6c-b348-f966508fd49d',
              name: 'Cooking Service',
              description: 'Home cooking service',
              basePrice: 149,
              reassuranceText: 'Professional home cooked meals',
              whatWillHappen: [
                'Cook will arrive with required ingredients',
                'Prepare fresh healthy meals',
                'Clean up kitchen after cooking',
              ],
              whatWillNotHappen: [
                'No extra items without approval',
                'No unhygienic food preparation',
              ],
              ifSomethingGoesWrong: 'Sevaq will replace cook or refund immediately',
              category: 'Cooking',
              isAvailable: true,
              isFastBooking: false,
              estimatedWaitTime: 120,
              workerCount: 6,
            });
            await this.serviceRepository.save(newService);
            this.logger.log('Cooking service added successfully');
          }
        } catch (e: any) {
          this.logger.warn(`Cooking service check/creation: ${e.message}`);
        }

        // Ensure workers have Cooking service assigned
        try {
          const cookingService = await this.serviceRepository.findOne({
            where: { category: 'Cooking' }
          });
          
          if (cookingService) {
            const workers = await this.workerRepository.find({
              relations: ['services']
            });
            let updatedCount = 0;
            
            for (const worker of workers) {
              const services = worker.services || [];
              const hasCookingService = services.some(s => s.id === cookingService.id);
              
              if (!hasCookingService) {
                worker.services = [...services, cookingService];
                await this.workerRepository.save(worker);
                updatedCount++;
                this.logger.log(`Added Cooking service to worker ${worker.id}`);
              }
            }
            
            if (updatedCount > 0) {
              this.logger.log(`Added Cooking service to ${updatedCount} workers`);
            }
          }
        } catch (e: any) {
          this.logger.warn(`Worker service update: ${e.message}`);
        }

        // Find on-demand bookings that need worker assignment
        // - type is 'on_demand'
        // - status is 'requested' or 'confirmed' (not completed/cancelled)
        // - no worker assigned (workerId is null)
        const bookingsToAssign = await this.bookingRepository.find({
          where: {
            type: In([BookingType.ON_DEMAND, BookingType.SUBSCRIPTION]),
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

       // Intelligent backoff logic
       if (bookingsToAssign.length === 0) {
         this.idleCounter = Math.min(this.idleCounter + 1, this.BACKOFF_LEVELS.length - 1);
         this.currentIntervalMs = this.BACKOFF_LEVELS[this.idleCounter];
         this.logger.log(`No bookings found, increasing interval to ${this.currentIntervalMs / 60000} minutes`);
       } else {
         this.idleCounter = 0;
         this.currentIntervalMs = this.BACKOFF_LEVELS[0];
         this.logger.log(`Found bookings, resetting interval to 1 minute`);
       }
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
           const errorMessage = error instanceof Error ? error.message : String(error);
           this.logger.error(
             `Error assigning worker for on-demand booking ${booking.id}: ${errorMessage}`,
           );
         }
       }

       this.logger.log(
         `On-demand assignment scheduler completed: ${successfulAssignments} assigned, ${failedAssignments} failed out of ${bookingsToAssign.length} bookings`,
       );
     } catch (error) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       this.logger.error(
         `Error in on-demand assignment scheduler: ${errorMessage}`,
       );
       // On error backoff more aggressively
       this.idleCounter = Math.min(this.idleCounter + 2, this.BACKOFF_LEVELS.length - 1);
       this.currentIntervalMs = this.BACKOFF_LEVELS[this.idleCounter];
     } finally {
       // Always clear the hard timeout and reset running flag
       clearTimeout(hardResetTimeout);
       this.isRunning = false;
     }

     // Schedule next run only after completion
     this.scheduleNextRun();
   }

   /**
    * Derive serviceId from subscription if missing
    */
   private async deriveServiceIdFromBooking(booking: Booking): Promise<number | null> {
     if (!booking.subscriptionId) return null;
     const subscription = await this.subscriptionRepository.findOne({
       where: { id: booking.subscriptionId },
     });
     if (!subscription) return null;

     let serviceType: string | null = null;

      // Try serviceProfileId
      if (subscription.serviceProfileId) {
        const profile = await this.serviceProfileRepository.findOne({
          where: { id: subscription.serviceProfileId },
        });
        if (profile) {
          serviceType = profile.serviceType as string;
          this.logger.log(`Derived serviceType "${serviceType}" from serviceProfileId ${subscription.serviceProfileId}`);
        }
      }

      // Fallback to customPlanData
      if (!serviceType && (subscription as any).customPlanData) {
        try {
          const rawCustomPlanData = (subscription as any).customPlanData;
          this.logger.log(`customPlanData raw type: ${typeof rawCustomPlanData}, value: ${JSON.stringify(rawCustomPlanData).substring(0, 100)}...`);
          
          const customPlanData = typeof rawCustomPlanData === 'string'
            ? JSON.parse(rawCustomPlanData)
            : rawCustomPlanData;
          
          this.logger.log(`Parsed customPlanData: serviceType=${customPlanData.serviceType}, category=${customPlanData.category}, bhk=${customPlanData.bhk}`);
          
          if (customPlanData.serviceType) {
            serviceType = customPlanData.serviceType;
            this.logger.log(`Derived serviceType "${serviceType}" from customPlanData.serviceType`);
          } else if (customPlanData.category) {
            serviceType = customPlanData.category;
            this.logger.log(`Derived serviceType "${serviceType}" from customPlanData.category`);
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          this.logger.warn(`Error parsing customPlanData for subscription ${subscription.id}: ${errorMessage}`);
        }
      }

     if (!serviceType) return null;

      // Map serviceType to category
      const normalizedType = String(serviceType).toUpperCase();
      let category: string | null = null;
      if (normalizedType === 'COOK' || normalizedType === 'COOKING' || normalizedType.includes('COOK')) {
        category = 'Cooking';
        this.logger.log(`Mapped serviceType "${serviceType}" to category "Cooking"`);
      } else if (normalizedType === 'MAID' || normalizedType.includes('MAID')) {
        category = 'Maid';
        this.logger.log(`Mapped serviceType "${serviceType}" to category "Maid"`);
      } else if (normalizedType === 'CLEANING' || normalizedType.includes('CLEAN')) {
        category = 'Cleaning';
        this.logger.log(`Mapped serviceType "${serviceType}" to category "Cleaning"`);
      } else {
        this.logger.warn(`Unknown serviceType "${serviceType}" (normalized: "${normalizedType}"), cannot map to category`);
      }

      if (!category) {
        this.logger.error(`No category mapped for serviceType "${serviceType}"`);
        return null;
      }

      this.logger.log(`Looking for service with category "${category}"...`);
      const service = await this.serviceRepository.findOne({
        where: { category },
      });

      if (!service) {
        this.logger.error(`No service found with category "${category}". Checking all services...`);
        const allServices = await this.serviceRepository.find();
        this.logger.error(`Available services: ${JSON.stringify(allServices.map(s => ({ id: s.id, category: s.category, name: s.name })))}`);
        return null;
      }

      this.logger.log(`Found service ID ${service.id} for category "${category}"`);
      return service.id;
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

      // If serviceId is missing, try to derive it from subscription
      if (!booking.serviceId) {
        const derivedServiceId = await this.deriveServiceIdFromBooking(booking);
        if (derivedServiceId) {
          booking.serviceId = derivedServiceId;
          // Update the booking in DB so other processes see it
          await this.bookingRepository.update(booking.id, { serviceId: derivedServiceId });
          this.logger.log(`Derived and set serviceId ${derivedServiceId} for booking ${booking.id}`);
        } else {
          this.logger.error(`Booking ${booking.id} has no serviceId and could not derive one`);
          return { success: false, reason: 'Booking has no serviceId' };
        }
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

      // Sync worker assignment to parent subscription (break circular dependency)
      if (booking.subscriptionId) {
        await this.subscriptionWorkerSyncService.syncWorkerToSubscription(
          booking.subscriptionId,
          nearestWorker.worker.id,
        );
      }

      // Send push notification to worker
      await this._notifyWorkerOfAssignment(nearestWorker.worker, booking);

      this.logger.log(
        `Directly assigned worker ${nearestWorker.worker.id} to on-demand booking ${booking.id} (distance: ${nearestWorker.distance.toFixed(2)}km)`,
      );

      return { success: true, worker: nearestWorker.worker };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in assignWorkerForBooking for booking ${booking.id}: ${errorMessage}`,
      );
      return { success: false, reason: errorMessage };
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
