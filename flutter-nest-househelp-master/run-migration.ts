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

  const host = configService.get('DB_HOST', 'localhost');
  const port = configService.get<number>('DB_PORT', 5432);
  const username = configService.get('DB_USERNAME', 'postgres');
  const password = configService.get('DB_PASSWORD', 'postgres');
  const database = configService.get('DB_NAME', 'sevaq_db');

  const dataSource = new DataSource({
    type: 'postgres',
    host: host,
    port: port,
    username: username,
    password: password,
    database: database,
    entities: [User, Service, Worker, Slot, Booking, Payment, Review, MicroZone, ServiceArea, Waitlist, ServiceRequest, AssignmentMetric, WorkerPerformanceMetric, UserBehaviorMetric, SystemPerformanceMetric],
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
    console.log('Data Source has been initialized!');

    await dataSource.runMigrations();
    console.log('Migrations have been run successfully!');

    await dataSource.destroy();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

runMigrations();