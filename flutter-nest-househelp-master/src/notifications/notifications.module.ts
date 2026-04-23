import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FcmHttpService } from './fcm-http.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { OnDemandNotificationScheduler } from './on-demand-notification.scheduler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { Worker } from '../workers/entities/worker.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Subscription, User, Worker]),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, FcmHttpService, NotificationsScheduler, OnDemandNotificationScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
