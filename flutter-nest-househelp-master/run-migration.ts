import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './src/users/entities/user.entity';
import { Service } from './src/services/entities/service.entity';
import { Worker } from './src/workers/entities/worker.entity';
import { Slot } from './src/slots/entities/slot.entity';
import { Booking } from './src/bookings/entities/booking.entity';
import { Payment } from './src/payments/entities/payment.entity';
import { Review } from './src/reviews/entities/review.entity';
import { MicroZone } from './src/locations/entities/micro_zone.entity';
import { ServiceArea } from './src/locations/entities/service_area.entity';
import { Waitlist } from './src/locations/entities/waitlist.entity';
import { ServiceRequest } from './src/service-requests/entities/service-request.entity';
import { AssignmentMetric, WorkerPerformanceMetric, UserBehaviorMetric, SystemPerformanceMetric } from './src/metrics/entities/metric.entity';
import { ServiceProfile } from './src/service-profiles/entities/service-profile.entity';
import { Subscription } from './src/subscriptions/entities/subscription.entity';
import { AdminUser } from './src/admin/entities/admin-user.entity';
import { AuditLog } from './src/audit/entities/audit-log.entity';
import { SupportTicket } from './src/support/entities/support-ticket.entity';
import { CommunicationLog } from './src/support/entities/communication-log.entity';
import { NotificationTemplate } from './src/config/entities/notification-template.entity';
import { BusinessHours } from './src/config/entities/business-hours.entity';
import { ServiceArea as ConfigServiceArea } from './src/config/entities/service-area.entity';
import { PricingRule } from './src/config/entities/pricing-rule.entity';
import { Payout } from './src/finance/entities/payout.entity';
import { Refund } from './src/finance/entities/refund.entity';
import { Address } from './src/addresses/entities/address.entity';
import { AddMissingServiceBookingColumns1736660000001 } from './src/migrations/add-missing-service-booking-columns';
import { FixWorkerLocationData1736660000000 } from './src/migrations/fix-worker-location-data';
import { AddMissingServiceDetailColumns1736660000002 } from './src/migrations/add-missing-service-detail-columns';
import { AddMissingMicroZoneColumns1736660000003 } from './src/migrations/add-missing-microzone-columns';
import { CreateServiceRequestsTable1736660000004 } from './src/migrations/create-service-requests-table';
import { RenameWorkerUserIdToUserId1768351862231 } from './src/migrations/1768351862231-RenameWorkerUserIdToUserId';
import { AddYearsOfExperienceToWorker1768351862230 } from './src/migrations/1768351862230-AddYearsOfExperienceToWorker';
import { AddPhoneUniqueConstraint1738467600000 } from './src/migrations/1738467600000-AddPhoneUniqueConstraint';
import { AddBookingTypeColumn1736660000002 } from './src/migrations/add-booking-type-column';
import { AddFcmTokenToWorker1739999999999 } from './src/migrations/add-fcm-token-to-worker';

async function runMigrations() {
  const configService = new ConfigService();

  // Support both DATABASE_URL (Railway) and individual DB_* variables
  const databaseUrl = configService.get('DATABASE_URL');
  
  let host = '';
  let port = 5432;
  let username = '';
  let password = '';
  let database = '';
  
  // Use DATABASE_URL only if it's a Railway URL (contains .railway)
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
      let dbPath = url.pathname.replace('/', '');
      if (dbPath && !dbPath.includes('.')) {
        database = dbPath;
      } else {
        database = configService.get('DB_NAME', 'railway');
      }
      console.log('📊 Parsed Railway DB config:', { host, port, username, database: '***', hasPassword: !!password });
    } catch (e) {
      console.error('❌ Failed to parse DATABASE_URL:', e.message);
      database = configService.get('DB_NAME', 'railway');
      host = configService.get('DB_HOST', 'localhost');
    }
  } else {
    host = configService.get('DB_HOST', 'localhost');
    port = configService.get<number>('DB_PORT', 5432);
    username = configService.get('DB_USERNAME', 'sevaq_user');
    password = configService.get('DB_PASSWORD', 'sevaq_password');
    database = configService.get('DB_NAME', 'sevaq_db');
  }

  const dataSource = new DataSource({
    type: 'postgres',
    host: host,
    port: port,
    username: username,
    password: password,
    database: database,
    entities: [
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
    ],
    synchronize: false,
    logging: true,
    migrations: [
      FixWorkerLocationData1736660000000,
      AddMissingServiceBookingColumns1736660000001,
      AddMissingServiceDetailColumns1736660000002,
      AddMissingMicroZoneColumns1736660000003,
      CreateServiceRequestsTable1736660000004,
      AddPhoneUniqueConstraint1738467600000,
      AddYearsOfExperienceToWorker1768351862230,
      RenameWorkerUserIdToUserId1768351862231,
      AddBookingTypeColumn1736660000002,
      AddFcmTokenToWorker1739999999999
    ],
  });

  try {
    await dataSource.initialize();
    console.log('✅ Data Source has been initialized!');

    await dataSource.runMigrations();
    console.log('✅ All migrations have been run successfully!');

    // Verify tables exist
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Created tables:');
    tables.forEach((table: any) => console.log(`  - ${table.table_name}`));
    console.log(`\n✅ Total tables created: ${tables.length}`);

    await dataSource.destroy();
    console.log('\n✅ Database schema initialization completed successfully!');
    console.log('✅ Database is ready for application usage.');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

runMigrations();
