import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User]),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
