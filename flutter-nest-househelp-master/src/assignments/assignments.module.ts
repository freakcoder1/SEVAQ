import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { WorkersModule } from '../workers/workers.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { SlotsModule } from '../slots/slots.module';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Worker, Service, User]),
    BookingsModule,
    WorkersModule,
    ServicesModule,
    UsersModule,
    SlotsModule,
    AvailabilityModule,
    NotificationsModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService, WorkersModule],
})
export class AssignmentsModule {}
