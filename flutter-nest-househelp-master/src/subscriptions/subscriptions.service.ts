import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, Frequency, SubscriptionStatus, BillingCycle } from './entities/subscription.entity';
import { ServiceProfilesService } from '../service-profiles/service-profiles.service';
import { ServiceProfile } from '../service-profiles/entities/service-profile.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private serviceProfilesService: ServiceProfilesService,
  ) {}

  async createSubscription(
    userId: number,
    serviceProfileId: number,
    frequency: Frequency,
    timeWindowStart: Date,
    timeWindowEnd: Date,
    startDate: Date,
    customDays?: number[],
  ): Promise<Subscription> {
    const serviceProfile = await this.serviceProfilesService.getProfileById(serviceProfileId);
    if (!serviceProfile) {
      throw new Error('Service profile not found');
    }

    const subscription = this.subscriptionRepository.create({
      publicId: uuidv4(),
      userId,
      serviceProfileId,
      frequency,
      timeWindowStart,
      timeWindowEnd,
      startDate,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      monthlyPriceSnapshot: Number(serviceProfile.monthlyPrice),
      customDays,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSubscriptionById(id: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({ where: { id } });
  }

  async getSubscriptionByPublicId(publicId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({ where: { publicId } });
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
        endDate: undefined,
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

  async getSubscriptionsByStatus(status: SubscriptionStatus): Promise<Subscription[]> {
    return this.subscriptionRepository.find({ where: { status } });
  }
}
