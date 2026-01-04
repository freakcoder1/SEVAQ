import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { WorkersModule } from './workers/workers.module';
import { SlotsModule } from './slots/slots.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { LocationsModule } from './locations/locations.module';
import { User } from './users/entities/user.entity';
import { Service } from './services/entities/service.entity';
import { Worker } from './workers/entities/worker.entity';
import { Slot } from './slots/entities/slot.entity';
import { Booking } from './bookings/entities/booking.entity';
import { Payment } from './payments/entities/payment.entity';
import { Review } from './reviews/entities/review.entity';
import { MicroZone } from './locations/entities/micro_zone.entity';
import { ServiceArea } from './locations/entities/service_area.entity';
import { Waitlist } from './locations/entities/waitlist.entity';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const entities = [User, Service, Worker, Slot, Booking, Payment, Review, MicroZone, ServiceArea, Waitlist];
        console.log('TypeORM entities:', entities.map(e => e.name));
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          entities: entities,
          synchronize: true, // Auto-create tables (dev only)
          logging: true, // Enable logging for connection and queries
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ServicesModule,
    WorkersModule,
    SlotsModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    LocationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
