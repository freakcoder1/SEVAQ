require('dotenv').config();

const { DataSource } = require('typeorm');
const { User } = require('./dist/src/users/entities/user.entity');
const { Worker } = require('./dist/src/workers/entities/worker.entity');
const { Booking } = require('./dist/src/bookings/entities/booking.entity');
const { ServiceRequest } = require('./dist/src/service-requests/entities/service-request.entity');
const { Waitlist } = require('./dist/src/locations/entities/waitlist.entity');
const { AssignmentMetrics } = require('./dist/src/metrics/entities/metric.entity');
const { UserBehaviorMetric } = require('./dist/src/metrics/entities/metric.entity');

async function checkRelatedTables() {
  try {
    console.log('🔍 Checking related tables for UUID user IDs...');

    // Create database connection
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'sevaq_db',
      entities: [
        'dist/**/*.entity.js'
      ],
      synchronize: false,
      logging: false
    });

    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Check workers table
    const workerRepository = dataSource.getRepository(Worker);
    const workers = await workerRepository.find({ relations: ['user'] });
    console.log(`\n📊 Found ${workers.length} workers:`);
    workers.forEach((worker, i) => {
      console.log(`${i+1}. Worker ID: ${worker.id}, User ID: ${worker.userId}, User Email: ${worker.user?.email || 'N/A'}`);
    });

    // Check bookings table
    const bookingRepository = dataSource.getRepository(Booking);
    const bookings = await bookingRepository.find({ relations: ['user'] });
    console.log(`\n📊 Found ${bookings.length} bookings:`);
    bookings.forEach((booking, i) => {
      console.log(`${i+1}. Booking ID: ${booking.id}, User ID: ${booking.userId}, User Email: ${booking.user?.email || 'N/A'}`);
    });

    // Check service_requests table
    const serviceRequestRepository = dataSource.getRepository(ServiceRequest);
    const serviceRequests = await serviceRequestRepository.find({ relations: ['user'] });
    console.log(`\n📊 Found ${serviceRequests.length} service requests:`);
    serviceRequests.forEach((request, i) => {
      console.log(`${i+1}. Request ID: ${request.id}, User ID: ${request.userId}, User Email: ${request.user?.email || 'N/A'}`);
    });

    // Check waitlist table
    const waitlistRepository = dataSource.getRepository(Waitlist);
    const waitlistEntries = await waitlistRepository.find({ relations: ['user'] });
    console.log(`\n📊 Found ${waitlistEntries.length} waitlist entries:`);
    waitlistEntries.forEach((entry, i) => {
      console.log(`${i+1}. Waitlist ID: ${entry.id}, User ID: ${entry.userId}, User Email: ${entry.user?.email || 'N/A'}`);
    });

    // Check assignment_metrics table
    const assignmentMetricsRepository = dataSource.getRepository(AssignmentMetrics);
    const assignmentMetrics = await assignmentMetricsRepository.find({ relations: ['user'] });
    console.log(`\n📊 Found ${assignmentMetrics.length} assignment metrics:`);
    assignmentMetrics.forEach((metric, i) => {
      console.log(`${i+1}. Metric ID: ${metric.id}, User ID: ${metric.userId}, User Email: ${metric.user?.email || 'N/A'}`);
    });

    // Check user_behavior_metrics table
    const userBehaviorMetricsRepository = dataSource.getRepository(UserBehaviorMetric);
    const userBehaviorMetrics = await userBehaviorMetricsRepository.find({ relations: ['user'] });
    console.log(`\n📊 Found ${userBehaviorMetrics.length} user behavior metrics:`);
    userBehaviorMetrics.forEach((metric, i) => {
      console.log(`${i+1}. Metric ID: ${metric.id}, User ID: ${metric.userId}, User Email: ${metric.user?.email || 'N/A'}`);
    });

    await dataSource.destroy();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error checking related tables:', error);
  }
}

checkRelatedTables();