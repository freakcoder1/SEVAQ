import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron('0 * * * * *')
  async handlePreServiceReminders() {
    this.logger.log('Checking for pre-service reminders to send');
    try {
      await this.notificationsService.checkAndSendReminders();
      this.logger.log('✅ Pre-service reminder check completed successfully');
    } catch (error) {
      this.logger.error('❌ Pre-service reminder check FAILED', error);
      // Do NOT log success on failure - this was the critical bug
    }
  }
}
