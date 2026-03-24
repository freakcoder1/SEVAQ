import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { AvailabilityService, AvailabilityCheckRequest, AvailabilityStatus } from '../availability/availability.service';
import { User } from '../users/entities/user.entity';

// IST timezone offset in milliseconds (UTC+5:30)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

@Injectable()
export class AvailabilityDetectionService {
  private readonly logger = new Logger(AvailabilityDetectionService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly availabilityService: AvailabilityService,
  ) {}

  /**
   * Get current time in IST timezone
   */
  private getNowInIST(): Date {
    const now = new Date();
    return new Date(now.getTime() + IST_OFFSET_MS);
  }

  /**
   * Get time window string from preferred time window enum
   */
  private getTimeWindowFromPreference(timeWindow: string): string {
    switch (timeWindow) {
      case 'MORNING':
        return 'morning';
      case 'AFTERNOON':
        return 'afternoon';
      case 'EVENING':
        return 'evening';
      default:
        return 'morning';
    }
  }

  /**
   * Detect availability for all subscriptions waiting for availability detection
   * This runs periodically to check if workers are available for subscriptions
   * that haven't received an availability notification yet.
   */
  async detectAndNotifyAvailability(): Promise<{ detected: number; notifications: number }> {
    this.logger.log('Running availability detection...');

    const nowIST = this.getNowInIST();

    // Find all ACTIVE subscriptions that:
    // 1. Have no assigned worker yet
    // 2. Haven't had availability detected yet
    // 3. Start date is in the future (not already started)
    const subscriptionsNeedingDetection = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        assignedWorkerId: null as any,
        availabilityDetectedAt: null as any,
      },
      relations: ['serviceProfile', 'user'],
    });

    this.logger.log(
      `Found ${subscriptionsNeedingDetection.length} subscriptions needing availability detection`,
    );

    let detected = 0;
    let notifications = 0;

    for (const subscription of subscriptionsNeedingDetection) {
      try {
        // Skip if subscription starts today or in the past (assignment scheduler handles these)
        const startDate =
          subscription.startDate instanceof Date
            ? subscription.startDate
            : new Date(subscription.startDate);

        // Only detect availability if start date is more than 24 hours from now
        // (Assignments happen 24-48h before start, so availability detection is for earlier)
        const hoursUntilStart = (startDate.getTime() - nowIST.getTime()) / (1000 * 60 * 60);

        if (hoursUntilStart <= 24) {
          this.logger.debug(
            `Skipping subscription ${subscription.id} - starts within 24 hours`,
          );
          continue;
        }

        const result = await this.checkSubscriptionAvailability(subscription);

        if (result.available) {
          this.logger.log(
            `Availability detected for subscription ${subscription.id}`,
          );

          // Set availabilityDetectedAt timestamp
          subscription.availabilityDetectedAt = new Date();
          await this.subscriptionRepository.save(subscription);

          // Send notification to user
          await this.sendAvailabilityNotification(subscription);
          
          detected++;
          notifications++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to check availability for subscription ${subscription.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Availability detection complete: ${detected} detected, ${notifications} notifications sent`,
    );

    return { detected, notifications };
  }

  /**
   * Check if any worker is available for a subscription
   */
  private async checkSubscriptionAvailability(
    subscription: Subscription,
  ): Promise<{ available: boolean }> {
    // Get user's location
    const location = this.getSubscriptionLocation(subscription);

    if (!location) {
      this.logger.warn(
        `No location found for subscription ${subscription.id}`,
      );
      return { available: false };
    }

    // Get start date in ISO format
    const startDate =
      subscription.startDate instanceof Date
        ? subscription.startDate
        : new Date(subscription.startDate);

    // Get time window from subscription preference
    const timeWindow = this.getTimeWindowFromPreference(
      subscription.preferredTimeWindow,
    );

    // Check availability using existing availability service
    const availabilityRequest: AvailabilityCheckRequest = {
      serviceId: subscription.serviceProfileId,
      date: startDate.toISOString(),
      timeWindow: timeWindow,
      userLat: location.lat,
      userLng: location.lng,
      radius: 5, // 5km radius
    };

    this.logger.log(
      `Checking availability for subscription ${subscription.id}: service=${subscription.serviceProfileId}, date=${startDate.toISOString()}, window=${timeWindow}`,
    );

    try {
      const result = await this.availabilityService.checkAvailability(
        availabilityRequest,
      );

      const isAvailable =
        result.status === AvailabilityStatus.AVAILABLE ||
        result.status === AvailabilityStatus.LIMITED;

      this.logger.log(
        `Availability check for subscription ${subscription.id}: status=${result.status}, availableCount=${result.availableCount}`,
      );

      return { available: isAvailable };
    } catch (error) {
      this.logger.error(
        `Availability check failed for subscription ${subscription.id}: ${error.message}`,
      );
      return { available: false };
    }
  }

  /**
   * Get subscription location (from subscription, then user)
   */
  private getSubscriptionLocation(subscription: Subscription): { lat: number; lng: number } | null {
    // First check if subscription has a location set
    if (subscription.location && subscription.location.lat && subscription.location.lng) {
      return { lat: subscription.location.lat, lng: subscription.location.lng };
    }

    // Fall back to user's location if user relation is loaded
    if (subscription.user) {
      const user = subscription.user as any;
      if (user.preferredLat && user.preferredLng) {
        return {
          lat: parseFloat(user.preferredLat),
          lng: parseFloat(user.preferredLng),
        };
      }
      if (user.latitude && user.longitude) {
        return {
          lat: parseFloat(user.latitude),
          lng: parseFloat(user.longitude),
        };
      }
    }

    return null;
  }

  /**
   * Send availability notification to user
   * Sends push notification, email, and SMS
   */
  private async sendAvailabilityNotification(
    subscription: Subscription,
  ): Promise<void> {
    // Get user from database
    const user = await this.usersRepository.findOne({
      where: { publicId: subscription.userId },
    });

    if (!user) {
      this.logger.warn(`User not found for subscription ${subscription.id}`);
      return;
    }

    const pushTitle = 'Professional Available';
    const pushBody = 'A SEVAQ professional is available for your service. We\'ll confirm and assign them within 24 hours of your start date.';

    // Log the notification (actual sending happens via existing NotificationsService)
    this.logger.log(
      `Availability notification for subscription ${subscription.id} to user ${subscription.userId}: pushTitle="${pushTitle}", pushBody="${pushBody}"`,
    );

    // Note: The actual notification sending is handled by the NotificationsScheduler
    // which processes notifications from the notifications table
    // This service sets the availabilityDetectedAt flag which triggers the notification
  }

  /**
   * Check availability for a specific subscription (for manual testing or API calls)
   */
  async checkAvailabilityForSubscription(subscriptionId: number): Promise<{
    available: boolean;
    availabilityDetectedAt?: Date;
  }> {
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

    // Check if already detected
    if (subscription.availabilityDetectedAt) {
      return {
        available: true,
        availabilityDetectedAt: subscription.availabilityDetectedAt,
      };
    }

    // Check availability
    const result = await this.checkSubscriptionAvailability(subscription);

    if (result.available) {
      subscription.availabilityDetectedAt = new Date();
      await this.subscriptionRepository.save(subscription);

      // Send notification
      await this.sendAvailabilityNotification(subscription);

      return {
        available: true,
        availabilityDetectedAt: subscription.availabilityDetectedAt,
      };
    }

    return { available: false };
  }
}
