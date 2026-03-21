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
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private serviceProfilesService: ServiceProfilesService,
    private dataSource: DataSource,
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

    return this.subscriptionRepository.save(subscription);
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
        [userId],
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
    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .innerJoin('subscription.user', 'user')
      .where('user.publicId = :publicId', { publicId })
      .leftJoinAndSelect('subscription.serviceProfile', 'serviceProfile')
      .leftJoinAndSelect('subscription.assignedWorker', 'assignedWorker')
      .leftJoinAndSelect('assignedWorker.user', 'workerUser')
      .orderBy('subscription.createdAt', 'DESC')
      .getMany();
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
