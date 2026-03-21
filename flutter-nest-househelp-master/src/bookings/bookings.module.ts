import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';

import { SlotsModule } from '../slots/slots.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Worker, Service, User, ServiceRequest]),
    SlotsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
