import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AvailabilityDetectionService } from './availability-detection.service';

@Injectable()
export class AvailabilityDetectionScheduler {
  private readonly logger = new Logger(AvailabilityDetectionScheduler.name);

  constructor(
    private readonly availabilityDetectionService: AvailabilityDetectionService,
  ) {}

  /**
   * Run every 15 minutes to detect availability for subscriptions
   * that haven't received an availability notification yet.
   * 
   * This provides early reassurance to users without committing
   * to a specific worker before the 24-hour assignment window.
   */
  @Cron('*/15 * * * *') // Every 15 minutes
  async handleAvailabilityDetection() {
    this.logger.log('Running availability detection scheduler...');

    try {
      const result = await this.availabilityDetectionService.detectAndNotifyAvailability();
      
      this.logger.log(
        `Availability detection completed: ${result.detected} subscriptions detected, ${result.notifications} notifications sent`,
      );
    } catch (error) {
      this.logger.error(
        `Availability detection scheduler failed: ${error.message}`,
      );
    }
  }

  /**
   * Manual trigger for availability detection
   * Useful for testing or manual runs
   */
  async triggerAvailabilityDetection(): Promise<{ detected: number; notifications: number }> {
    this.logger.log('Manual availability detection triggered');
    return this.availabilityDetectionService.detectAndNotifyAvailability();
  }
}
