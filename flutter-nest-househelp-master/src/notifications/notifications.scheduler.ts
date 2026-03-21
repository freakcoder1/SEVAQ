import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron('0 */15 * * * *')
  async handlePreServiceReminders() {
    this.logger.log('Checking for pre-service reminders to send');
    try {
      await this.notificationsService.checkAndSendReminders();
      this.logger.log('Pre-service reminder check completed');
    } catch (error) {
      this.logger.error('Error checking for pre-service reminders:', error);
    }
  }
}
