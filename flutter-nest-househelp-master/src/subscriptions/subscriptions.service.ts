import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import {
  Subscription,
  PreferredTimeWindow,
  SubscriptionStatus,
  BillingCycle,
} from './entities/subscription.entity';
import { ServiceProfilesService } from '../service-profiles/service-profiles.service';
import { ServiceProfile } from '../service-profiles/entities/service-profile.entity';
import { Booking, BookingStatus, BookingType, LocationData } from '../bookings/entities/booking.entity';
import { SubscriptionWorkerSyncService } from '../subscriptions/subscription-worker-sync.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private serviceProfilesService: ServiceProfilesService,
    private dataSource: DataSource,
    private subscriptionWorkerSyncService: SubscriptionWorkerSyncService,
  ) {}

  async createSubscription(
    userId: string,
    serviceProfileId: number | null,
    preferredTimeWindow: PreferredTimeWindow,
    startDate: Date,
    location: { lat: number; lng: number; address?: string },
    monthlyPriceSnapshot: number,
    customPlanData?: any,
  ): Promise<Subscription> {
    let serviceProfile = null;
    
    if (serviceProfileId !== null && serviceProfileId !== undefined) {
      serviceProfile = await this.serviceProfilesService.getProfileById(serviceProfileId);
      if (!serviceProfile) {
        throw new Error('Service profile not found');
      }
    }
    
    // For custom plans, serviceProfileId can be null - we use the provided monthlyPriceSnapshot directly

    // Check for existing active subscription with the same service profile
    const existingQuery: any = {
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
    };
    
    // Only add serviceProfileId filter if it's not null (custom plan)
    if (serviceProfileId !== null && serviceProfileId !== undefined) {
      existingQuery.where.serviceProfileId = serviceProfileId;
    }
    
    const existingSubscription = await this.subscriptionRepository.findOne(existingQuery);

    if (existingSubscription) {
      throw new Error(
        `You already have an active subscription for this service (Subscription #${existingSubscription.id}). Please cancel it first or manage your existing subscription.`,
      );
    }

    // ✅ VALIDATION: Ensure start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateNormalized = new Date(startDate);
    startDateNormalized.setHours(0, 0, 0, 0);
    
    if (startDateNormalized < today) {
      throw new Error('Subscription start date cannot be in the past. Please select a future date.');
    }

    const subscriptionData: any = {
      publicId: uuidv4(),
      userId,
      preferredTimeWindow,
      startDate,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      location,
    };
    
    // Only set serviceProfileId if it's not null (custom plan)
    if (serviceProfileId !== null && serviceProfileId !== undefined) {
      subscriptionData.serviceProfileId = serviceProfileId;
    }
    
    // Use provided monthlyPriceSnapshot directly for custom plans
    if (monthlyPriceSnapshot !== undefined && monthlyPriceSnapshot !== null) {
      subscriptionData.monthlyPriceSnapshot = monthlyPriceSnapshot;
    } else if (serviceProfile) {
      subscriptionData.monthlyPriceSnapshot = Number(serviceProfile.monthlyPrice);
    }
    
    const subscription = this.subscriptionRepository.create(subscriptionData);

    if (!preferredTimeWindow) {
      throw new Error('Preferred time window is required');
    }

    const savedSubscriptions = await this.subscriptionRepository.save(subscription);
    const savedSubscription = Array.isArray(savedSubscriptions) ? savedSubscriptions[0] : savedSubscriptions;

    // ✅ Generate all 4 weekly bookings UPFRONT immediately at purchase time
    for (let week = 0; week < 4; week++) {
      const bookingDate = new Date(startDate);
      bookingDate.setDate(bookingDate.getDate() + (week * 7));
      
      // Calculate time window
      let startHour = 8;
      let endHour = 12;
      switch (preferredTimeWindow.toLowerCase()) {
        case 'morning': startHour = 8; endHour = 12; break;
        case 'afternoon': startHour = 12; endHour = 17; break;
        case 'evening': startHour = 16; endHour = 21; break;
        case 'early-morning': startHour = 6; endHour = 11; break;
      }

      // ✅ Create booking directly with repository to avoid circular dependency
      try {
        // Format date as YYYY-MM-DD string for Booking entity
        const dateStr = bookingDate.toISOString().split('T')[0];
        
        // Build location data matching LocationData entity structure
        const locationData: LocationData = {
          lat: location.lat,
          lng: location.lng,
          latitude: location.lat,
          longitude: location.lng,
          address: location.address || '',
        };

        const bookingData: DeepPartial<Booking> = {
          userId,
          serviceId: serviceProfileId ?? undefined,
          date: dateStr,
          startTime: `${startHour.toString().padStart(2, '0')}:00:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00:00`,
          location: locationData,
          type: BookingType.SUBSCRIPTION,
          subscriptionId: savedSubscription.id,
          status: BookingStatus.REQUESTED,
          notes: `Auto generated for subscription ${savedSubscription.id} - Week ${week + 1}`,
        };

        const booking = this.bookingsRepository.create(bookingData);
        await this.bookingsRepository.save(booking);
        this.logger.log(`✅ Created booking ${week + 1} for subscription ${savedSubscription.id}`);
      } catch (error: any) {
        this.logger.error(`❌ FAILED to create booking ${week + 1} for subscription ${savedSubscription.id}: ${error?.message ?? String(error)}`, error?.stack);
        throw error;
      }
    }

    this.logger.log(`✅ SUCCESS: Created all 4 bookings for subscription ${savedSubscription.id}`);

    return savedSubscription;
    }
 
    /**
     * Generate weekly bookings for an existing subscription.
     * Used when a subscription is renewed and needs future bookings.
     *
     * @param subscriptionId - The subscription ID
     * @param startDate - The start date for the first new booking
     * @param weeks - Number of weekly bookings to generate (default 4)
     */
   async generateBookingsForSubscription(
     subscriptionId: number,
     startDate: Date,
     weeks: number = 4,
   ): Promise<void> {
     // Load subscription with all necessary fields
     const subscription = await this.subscriptionRepository.findOne({
       where: { id: subscriptionId },
     });
 
     if (!subscription) {
       throw new Error(`Subscription ${subscriptionId} not found`);
     }
 
     const { userId, serviceProfileId, location, preferredTimeWindow } = subscription;
 
     if (!location) {
       throw new Error(
         `Subscription ${subscriptionId} has no location set. Cannot generate bookings.`,
       );
     }
 
     // Calculate time window from preferredTimeWindow
     let startHour = 8;
     let endHour = 12;
     switch (preferredTimeWindow.toLowerCase()) {
       case 'morning':
         startHour = 8;
         endHour = 12;
         break;
       case 'afternoon':
         startHour = 12;
         endHour = 17;
         break;
       case 'evening':
         startHour = 16;
         endHour = 21;
         break;
       case 'early-morning':
         startHour = 6;
         endHour = 11;
         break;
     }
 
     // Build location data
     const locationData: LocationData = {
       lat: location.lat,
       lng: location.lng,
       latitude: location.lat,
       longitude: location.lng,
       address: location.address || '',
     };
 
     let createdCount = 0;
 
     for (let week = 0; week < weeks; week++) {
       const bookingDate = new Date(startDate);
       bookingDate.setDate(bookingDate.getDate() + (week * 7));
       const dateStr = bookingDate.toISOString().split('T')[0];
 
       // Skip if a booking already exists for this subscription on this date
       const existing = await this.bookingsRepository.findOne({
         where: {
           subscriptionId,
           date: dateStr,
         },
       });
       if (existing) {
         this.logger.debug(
           `Booking for ${dateStr} already exists for subscription ${subscriptionId}, skipping`,
         );
         continue;
       }
 
       const bookingData: DeepPartial<Booking> = {
         userId,
         serviceId: serviceProfileId ?? undefined,
         date: dateStr,
         startTime: `${startHour.toString().padStart(2, '0')}:00:00`,
         endTime: `${endHour.toString().padStart(2, '0')}:00:00`,
         location: locationData,
         type: BookingType.SUBSCRIPTION,
         subscriptionId,
         status: BookingStatus.REQUESTED,
         notes: `Auto-generated for subscription ${subscriptionId} - Week ${week + 1}`,
       };
 
       const booking = this.bookingsRepository.create(bookingData);
       await this.bookingsRepository.save(booking);
       createdCount++;
       this.logger.log(
         `✅ Created booking ${week + 1} for subscription ${subscriptionId} on ${dateStr}`,
       );
     }
 
     this.logger.log(
       `✅ Generated ${createdCount} new bookings for subscription ${subscriptionId}`,
     );
   }

  /**
   * Resolves a user identifier to a UUID.
   * Handles legacy integer user IDs by looking up the user's actual UUID.
   */
  private async resolveUserIdToUuid(userId: string): Promise<string> {
    // Check if userId is already a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(userId)) {
      return userId;
    }

    // If it's a legacy integer ID, look up the user's UUID
    try {
      const userResult = await this.dataSource.query(
        'SELECT id FROM "user" WHERE id::text = $1 LIMIT 1',
        [userId]
      );
      
      if (userResult && userResult.length > 0) {
        return userResult[0].id;
      }
      
      // If no user found with integer ID, return original userId
      // This will result in no subscriptions found
      return userId;
    } catch (error) {
      // If query fails, return original userId
      return userId;
    }
  }

  async getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    // Resolve legacy integer IDs to UUID
    const resolvedUserId = await this.resolveUserIdToUuid(userId);
    
    return this.subscriptionRepository.find({
      where: { userId: resolvedUserId },
      relations: ['serviceProfile', 'assignedWorker', 'assignedWorker.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSubscriptionById(id: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({ where: { id } });
  }

  async getSubscriptionByPublicId(
    publicId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({ where: { publicId } });
  }

  async getSubscriptionsByPublicId(publicId: string): Promise<Subscription[]> {
    // subscription.userId directly stores user publicId (UUID), no join needed
    return this.subscriptionRepository.find({
      where: { userId: publicId },
      relations: ['serviceProfile', 'assignedWorker', 'assignedWorker.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async pauseSubscription(id: number): Promise<Subscription> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.status = SubscriptionStatus.PAUSED;
    return this.subscriptionRepository.save(subscription);
  }

  async resumeSubscription(id: number): Promise<Subscription> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(id: number): Promise<Subscription> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.endDate = new Date();
    return this.subscriptionRepository.save(subscription);
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  async updateSubscription(
    id: number,
    updates: Partial<Subscription>,
  ): Promise<Subscription> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    Object.assign(subscription, updates);
    return this.subscriptionRepository.save(subscription);
  }

  async getSubscriptionsByStatus(
    status: SubscriptionStatus,
  ): Promise<Subscription[]> {
    return this.subscriptionRepository.find({ where: { status } });
  }

  /**
   * Sync worker assignment from a booking to the parent subscription
   * Updates the subscription's assignedWorkerId and related fields
   */
  async assignWorkerToSubscription(
    subscriptionId: number,
    workerId: number,
  ): Promise<Subscription> {
    // Delegate to the sync service to avoid circular dependency with BookingsService
    await this.subscriptionWorkerSyncService.syncWorkerToSubscription(subscriptionId, workerId);
    
    // Fetch and return the updated subscription
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    return subscription;
  }
}
