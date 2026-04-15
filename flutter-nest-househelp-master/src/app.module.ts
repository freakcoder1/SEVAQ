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
import { AdminModule } from './admin/admin.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AddressesModule } from './addresses/addresses.module';
import { MetricsModule } from './metrics/metrics.module';
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
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { AdminUser } from './admin/entities/admin-user.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { FinanceModule } from './finance/finance.module';
import { SupportModule } from './support/support.module';
import { SystemConfigModule } from './config/config.module';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { ResponseTimeInterceptor } from './common/interceptors/response-time.interceptor';
import { SupportTicket } from './support/entities/support-ticket.entity';
import { CommunicationLog } from './support/entities/communication-log.entity';
import { NotificationTemplate } from './config/entities/notification-template.entity';
import { BusinessHours } from './config/entities/business-hours.entity';
import { ServiceArea as ConfigServiceArea } from './config/entities/service-area.entity';
import { PricingRule } from './config/entities/pricing-rule.entity';
import { Payout } from './finance/entities/payout.entity';
import { Refund } from './finance/entities/refund.entity';
import { Address } from './addresses/entities/address.entity';

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
        
        let host = '';
        let port = 5432;
        let username = '';
        let password = '';
        let database = '';
        
        // Use DATABASE_URL only if it's a Railway URL (contains .railway)
        // Otherwise fallback to individual DB_* variables (for local dev)
        const isRailwayUrl = databaseUrl && (databaseUrl.includes('.railway') || databaseUrl.includes('.rlwy.net'));
        
        if (isRailwayUrl) {
          // Parse DATABASE_URL (format: postgres://user:pass@host:port/database)
          console.log('🔍 Railway DATABASE_URL detected, parsing...');
          try {
            const url = new URL(databaseUrl);
            host = url.hostname;
            port = parseInt(url.port) || 5432;
            username = url.username;
            password = url.password;
            // Handle both path-based and socket-based URLs
            let dbPath = url.pathname.replace('/', '');
            if (dbPath && !dbPath.includes('.')) {
              database = dbPath;
            } else {
              // Fall back to DB_NAME env or default
              database = configService.get('DB_NAME', 'railway');
            }
            console.log('📊 Parsed Railway DB config:', { host, port, username, database: '***', hasPassword: !!password });
          } catch (e) {
            console.error('❌ Failed to parse DATABASE_URL:', e.message);
            // If URL parsing fails, use fallback
            database = configService.get('DB_NAME', 'railway');
            host = configService.get('DB_HOST', 'localhost');
          }
        } else if (databaseUrl) {
          console.log('🔍 Non-Railway DATABASE_URL detected, skipping (using DB_* vars)');
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

        console.log('🔧 Final DB config:', { host, port, username, database: '***', hasPassword: !!password });

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
          ConfigServiceArea,
          Waitlist,
          ServiceRequest,
          AssignmentMetric,
          WorkerPerformanceMetric,
          UserBehaviorMetric,
          SystemPerformanceMetric,
          ServiceProfile,
          Subscription,
          AdminUser,
          AuditLog,
          SupportTicket,
          CommunicationLog,
          NotificationTemplate,
          BusinessHours,
          PricingRule,
          Payout,
          Refund,
          Address,
        ];

        return {
          type: 'postgres',
          host: host,
          port: port,
          username: username,
          password: password,
          database: database,
          entities: entities,
          // ❗ PRODUCTION SAFETY: NEVER enable synchronize in production
          // This will DESTROY all production data if enabled
          // Only enable this locally for development, never on Railway
          // ✅ HARD LOCK: NO ENVIRONMENT VARIABLE CAN OVERRIDE THIS
          synchronize: process.env.NODE_ENV === 'development' && process.env.SYNCHRONIZE === 'true',
          logging: ['error', 'warn'], // Reduce logging to only errors and warnings
          logger: 'advanced-console', // Use advanced console logger
          // Railway Postgres SSL configuration - required for external connections
          ssl: process.env.DB_SSL_REQUIRE === 'true' ? {
            rejectUnauthorized: false
          } : false,
          // Connection pool configuration for Railway
          extra: {
            max: process.env.NODE_ENV === 'production' ? 15 : 10,
            idleTimeoutMillis: 30000, // 30 seconds - give more time before closing idle connections
            connectionTimeoutMillis: 8000,
            keepAlive: true,
            keepAliveInitialDelayMillis: 5000,
            statement_timeout: 15000,
            query_timeout: 15000,
          },
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
    AdminModule,
    MetricsModule,
    AuditModule,
    AnalyticsModule,
    MonitoringModule,
    FinanceModule,
    SupportModule,
    SystemConfigModule,
    AddressesModule,
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
