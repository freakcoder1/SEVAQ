import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, AssignmentState, BookingType } from '../bookings/entities/booking.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class OnDemandNotificationScheduler {
  private readonly logger = new Logger(OnDemandNotificationScheduler.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Scheduler that runs EVERY 30 SECONDS for on-demand booking notifications
   * This is much faster than subscription scheduler since on-demand bookings need immediate delivery
   */
  @Cron('*/30 * * * * *')
  async handleOnDemandNotifications(): Promise<void> {
    this.logger.debug('Checking pending on-demand bookings for notifications...');

    try {
      // Find all on-demand bookings that are pending assignment and have not had notification sent
      const pendingBookings = await this.bookingRepository.find({
        where: {
          type: BookingType.ON_DEMAND,
          assignmentState: AssignmentState.PENDING,
          notificationSent: false,
        },
        relations: ['worker', 'user'],
      });

      if (pendingBookings.length === 0) {
        this.logger.debug('No pending on-demand bookings found');
        return;
      }

      this.logger.log(`Found ${pendingBookings.length} on-demand bookings pending notification`);

      for (const booking of pendingBookings) {
        try {
          this.logger.log(`Sending notification for on-demand booking ${booking.id}`);
          
          // Send FCM push notification to the assigned worker
          if (booking.worker && booking.worker.fcmToken) {
            const title = '📣 New Booking Request';
            const body = `You have a new ${booking.type} booking request. Tap to accept.`;
            
            await this.notificationsService.sendFullScreenPushNotification(
              booking.worker.fcmToken,
              title,
              body,
              {
                bookingId: booking.id,
                type: 'NEW_BOOKING',
              }
            );
            
            // Mark notification as sent so we don't send it again
            booking.notificationSent = true;
            await this.bookingRepository.save(booking);
            
            this.logger.log(`✅ Notification sent successfully for booking ${booking.id}`);
          } else {
            this.logger.warn(`⚠️ No FCM token found for worker on booking ${booking.id}, skipping notification`);
            // Still mark as sent to avoid infinite loop
            booking.notificationSent = true;
            await this.bookingRepository.save(booking);
          }
        } catch (notificationError: unknown) {
          const errorMessage = notificationError instanceof Error ? notificationError.message : String(notificationError);
          const errorStack = notificationError instanceof Error ? notificationError.stack : undefined;
          
          this.logger.error(
            `Failed to send notification for booking ${booking.id}: ${errorMessage}`,
            errorStack,
          );
        }
      }

      this.logger.log('On-demand notification processing completed');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(
        `Error in on-demand notification scheduler: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
