import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';
import { ServiceRequestsService } from '../service-requests/service-requests.service';
import { ServiceRequestSource } from '../service-requests/entities/service-request.entity';

@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Cron('0 0 * * *') // Runs daily at midnight
  async handleDailySubscriptionProcessing() {
    this.logger.log('Starting daily subscription processing');

    try {
      const activeSubscriptions = await this.subscriptionsService.getActiveSubscriptions();
      this.logger.log(`Found ${activeSubscriptions.length} active subscriptions`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const subscription of activeSubscriptions) {
        // Check if subscription is still active and not ended
        if (
          subscription.status === 'ACTIVE' &&
          (!subscription.endDate || subscription.endDate > today) &&
          subscription.startDate <= today
        ) {
          // Check if today matches the subscription frequency
          if (this.isTodayMatchingFrequency(subscription, today)) {
            // Create service request for today
            await this.createServiceRequest(subscription, today);
          }
        }
      }

      this.logger.log('Daily subscription processing completed');
    } catch (error) {
      this.logger.error('Error processing subscriptions', error);
    }
  }

  private isTodayMatchingFrequency(subscription: any, today: Date): boolean {
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    switch (subscription.frequency) {
      case 'DAILY':
        return true;
      
      case 'WEEKDAYS':
        return todayDayOfWeek >= 1 && todayDayOfWeek <= 5; // Monday to Friday
      
      case 'CUSTOM_DAYS':
        if (subscription.customDays && Array.isArray(subscription.customDays)) {
          return subscription.customDays.includes(todayDayOfWeek);
        }
        return false;
      
      default:
        return false;
    }
  }

  private async createServiceRequest(subscription: any, date: Date) {
    try {
      // Create service request for today's date
      const scheduledStart = new Date(date);
      scheduledStart.setHours(
        subscription.timeWindowStart.getHours(),
        subscription.timeWindowStart.getMinutes(),
        0,
        0,
      );

      const scheduledEnd = new Date(date);
      scheduledEnd.setHours(
        subscription.timeWindowEnd.getHours(),
        subscription.timeWindowEnd.getMinutes(),
        0,
        0,
      );

      const timeWindow = this.getTimeWindowString(subscription.timeWindowStart, subscription.timeWindowEnd);

      await this.serviceRequestsService.create(subscription.userId, {
        serviceProfileId: subscription.serviceProfileId,
        source: ServiceRequestSource.SUBSCRIPTION,
        date: date.toISOString().split('T')[0],
        timeWindow: timeWindow,
        priceSnapshot: subscription.monthlyPriceSnapshot / 30, // Daily price approximation
      });

      this.logger.log(
        `Created service request for subscription ${subscription.id} on ${date.toISOString().split('T')[0]}`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating service request for subscription ${subscription.id}:`,
        error,
      );
    }
  }

  private getTimeWindowString(start: Date, end: Date): string {
    const startHour = start.getHours();
    const endHour = end.getHours();

    if (startHour < 12) {
      if (endHour <= 12) {
        return 'morning';
      } else if (endHour <= 17) {
        return 'afternoon';
      } else {
        return 'evening';
      }
    } else if (startHour < 17) {
      if (endHour <= 17) {
        return 'afternoon';
      } else {
        return 'evening';
      }
    } else {
      return 'evening';
    }
  }
}
