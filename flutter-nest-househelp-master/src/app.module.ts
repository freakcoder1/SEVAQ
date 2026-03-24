import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { AssignmentsModule } from './assignments/assignments.module';
import { AvailabilityModule } from './availability/availability.module';
import { CitiesModule } from './cities/cities.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { SystemStatusModule } from './system-status/system-status.module';
import { HomeModule } from './home/home.module';
import { HealthModule } from './health/health.module';
import { MonitoringDashboardModule } from './monitoring-dashboard/monitoring-dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { DatabaseModule } from './database/database.module';
import { ServiceProfilesModule } from './service-profiles/service-profiles.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
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
import { ServiceRequest } from './service-requests/entities/service-request.entity';
import {
  AssignmentMetric,
  WorkerPerformanceMetric,
  UserBehaviorMetric,
  SystemPerformanceMetric,
} from './metrics/entities/metric.entity';
import { ServiceProfile } from './service-profiles/entities/service-profile.entity';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { ResponseTimeInterceptor } from './common/interceptors/response-time.interceptor';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute
        },
      ],
    }),
    PrometheusModule.register(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Support both DATABASE_URL (Railway) and individual DB_* variables
        const databaseUrl = configService.get('DATABASE_URL');
        
        let host: string;
        let port: number;
        let username: string;
        let password: string;
        let database: string;
        
        if (databaseUrl) {
          // Parse DATABASE_URL (format: postgres://user:pass@host:port/database)
          const url = new URL(databaseUrl);
          host = url.hostname;
          port = parseInt(url.port) || 5432;
          username = url.username;
          password = url.password;
          database = url.pathname.replace('/', '');
        } else {
          // Use individual DB_* variables
          host = configService.get('DB_HOST', 'localhost');
          port = configService.get<number>('DB_PORT', 5432);
          username = configService.get('DB_USERNAME', 'sevaq_user');
          password = configService.get('DB_PASSWORD', 'sevaq_password');
          database = configService.get('DB_NAME', 'sevaq_db');
        }

        // Validate required environment variables
        if (!host) {
          throw new Error('Missing required environment variable: DB_HOST or DATABASE_URL');
        }
        if (!database) {
          throw new Error('Missing required environment variable: DB_NAME or DATABASE_URL');
        }

        const entities = [
          User,
          Service,
          Worker,
          Slot,
          Booking,
          Payment,
          Review,
          MicroZone,
          ServiceArea,
          Waitlist,
          ServiceRequest,
          AssignmentMetric,
          WorkerPerformanceMetric,
          UserBehaviorMetric,
          SystemPerformanceMetric,
          ServiceProfile,
          Subscription,
        ];

        return {
          type: 'postgres',
          host: host,
          port: port,
          username: username,
          password: password,
          database: database,
          entities: entities,
          synchronize: false, // Disable synchronize for production
          logging: ['error', 'warn'], // Reduce logging to only errors and warnings
          logger: 'advanced-console', // Use advanced console logger
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
    AssignmentsModule,
    ServiceRequestsModule,
    SystemStatusModule,
    HealthModule,
    MonitoringDashboardModule,
    NotificationsModule,
    HomeModule,
    ServiceProfilesModule,
    SubscriptionsModule,
    // DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_FILTER',
      useClass: ValidationExceptionFilter,
    },
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'endpoint', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'endpoint'],
    }),
    makeCounterProvider({
      name: 'http_requests_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'endpoint', 'status_code'],
    }),
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: ResponseTimeInterceptor,
    },
  ],
})
export class AppModule {}
