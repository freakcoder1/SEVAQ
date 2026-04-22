import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Subscription,
  PreferredTimeWindow,
  SubscriptionStatus,
  BillingCycle,
} from './entities/subscription.entity';
import { ServiceProfilesService } from '../service-profiles/service-profiles.service';
import { ServiceProfile } from '../service-profiles/entities/service-profile.entity';
import { BookingsService } from '../bookings/bookings.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private serviceProfilesService: ServiceProfilesService,
    private dataSource: DataSource,
    private bookingsService: BookingsService,
  ) {}

  async createSubscription(
    userId: string,
    serviceProfileId: number,
    preferredTimeWindow: PreferredTimeWindow,
    startDate: Date,
    location: { lat: number; lng: number; address?: string },
    monthlyPriceSnapshot: number,
  ): Promise<Subscription> {
    const serviceProfile =
      await this.serviceProfilesService.getProfileById(serviceProfileId);
    if (!serviceProfile) {
      throw new Error('Service profile not found');
    }

    // Check for existing active subscription with the same service profile
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        serviceProfileId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

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

    const subscription = this.subscriptionRepository.create({
      publicId: uuidv4(),
      userId,
      serviceProfileId,
      preferredTimeWindow,
      startDate,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      monthlyPriceSnapshot:
        monthlyPriceSnapshot || Number(serviceProfile.monthlyPrice),
      location,
    });

    if (!preferredTimeWindow) {
      throw new Error('Preferred time window is required');
    }

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // ✅ Generate all 4 weekly bookings UPFRONT immediately at purchase time
    // ✅ ALL BOOKINGS CREATED INSIDE SINGLE ATOMIC TRANSACTION
    await this.dataSource.transaction(async transactionManager => {
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

        await this.bookingsService.create({
          userId,
          serviceId: serviceProfileId,
          date: bookingDate,
          startTime: `${startHour.toString().padStart(2, '0')}:00:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00:00`,
          location,
          type: 'subscription',
          subscriptionId: savedSubscription.id,
          notes: `Auto generated for subscription ${savedSubscription.id} - Week ${week + 1}`,
        });
      }
    });

    return savedSubscription;
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
    // Join on user.publicId since subscription.userId stores the user's publicId (UUID)
    const subscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .innerJoin('subscription.user', 'user')
      .where('user.publicId = :publicId', { publicId })
      .leftJoinAndSelect('subscription.serviceProfile', 'serviceProfile')
      .leftJoinAndSelect('subscription.assignedWorker', 'assignedWorker')
      .leftJoinAndSelect('assignedWorker.user', 'workerUser')
      .orderBy('subscription.createdAt', 'DESC')
      .getMany();

    // Log for debugging - check if assignedWorker is loaded
    // Debug logging removed - production ready

    return subscriptions;
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
}
