import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Subscription } from './entities/subscription.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { ServiceProfile } from '../service-profiles/entities/service-profile.entity';
import { Service } from '../services/entities/service.entity';
import { Worker } from '../workers/entities/worker.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionAssignmentScheduler } from './subscription-assignment.scheduler';
import { OnDemandAssignmentScheduler } from './on-demand-assignment.scheduler';
import { ServiceProfilesModule } from '../service-profiles/service-profiles.module';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';
import { WorkersModule } from '../workers/workers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Booking, User, ServiceProfile, Service, Worker]),
    ServiceProfilesModule,
    ServicesModule,
    WorkersModule,
    BookingsModule,
    UsersModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService, 
    SubscriptionAssignmentScheduler,
    OnDemandAssignmentScheduler,
  ],
  exports: [
    SubscriptionsService,
    SubscriptionAssignmentScheduler,
    OnDemandAssignmentScheduler,
  ],
})
export class SubscriptionsModule {}
