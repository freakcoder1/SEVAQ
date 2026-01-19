require('dotenv').config();

const { DataSource } = require('typeorm');
const { User } = require('./dist/src/users/entities/user.entity');
const { Worker } = require('./dist/src/workers/entities/worker.entity');
const { ServiceRequest } = require('./dist/src/service-requests/entities/service-request.entity');
const { Waitlist } = require('./dist/src/locations/entities/waitlist.entity');
const { AssignmentMetrics } = require('./dist/src/metrics/entities/metric.entity');
const { UserBehaviorMetric } = require('./dist/src/metrics/entities/metric.entity');

async function checkDataIntegrity() {
  try {
    console.log('🔍 Checking data integrity post-migration...');

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

    // Check workers table integrity
    const workerRepository = dataSource.getRepository(Worker);
    const workers = await workerRepository.find();
    console.log(`\n📊 Checking ${workers.length} workers for data integrity:`);
    let workerIssues = 0;
    for (const worker of workers) {
      const user = await dataSource.getRepository(User).findOne({ where: { id: worker.userId } });
      if (!user) {
        console.log(`❌ Worker ID ${worker.id} references non-existent user ID ${worker.userId}`);
        workerIssues++;
      }
    }
    if (workerIssues === 0) {
      console.log('✅ All workers reference valid users');
    }

    // Check service_requests table integrity
    const serviceRequestRepository = dataSource.getRepository(ServiceRequest);
    const serviceRequests = await serviceRequestRepository.find();
    console.log(`\n📊 Checking ${serviceRequests.length} service requests for data integrity:`);
    let serviceRequestIssues = 0;
    for (const request of serviceRequests) {
      const user = await dataSource.getRepository(User).findOne({ where: { id: request.userId } });
      if (!user) {
        console.log(`❌ Service Request ID ${request.id} references non-existent user ID ${request.userId}`);
        serviceRequestIssues++;
      }
    }
    if (serviceRequestIssues === 0) {
      console.log('✅ All service requests reference valid users');
    }

    // Check waitlist table integrity
    const waitlistRepository = dataSource.getRepository(Waitlist);
    const waitlistEntries = await waitlistRepository.find();
    console.log(`\n📊 Checking ${waitlistEntries.length} waitlist entries for data integrity:`);
    let waitlistIssues = 0;
    for (const entry of waitlistEntries) {
      const user = await dataSource.getRepository(User).findOne({ where: { id: entry.userId } });
      if (!user) {
        console.log(`❌ Waitlist Entry ID ${entry.id} references non-existent user ID ${entry.userId}`);
        waitlistIssues++;
      }
    }
    if (waitlistIssues === 0) {
      console.log('✅ All waitlist entries reference valid users');
    }

    // Check assignment_metrics table integrity
    const assignmentMetricsRepository = dataSource.getRepository(AssignmentMetrics);
    const assignmentMetrics = await assignmentMetricsRepository.find();
    console.log(`\n📊 Checking ${assignmentMetrics.length} assignment metrics for data integrity:`);
    let assignmentMetricsIssues = 0;
    for (const metric of assignmentMetrics) {
      const user = await dataSource.getRepository(User).findOne({ where: { id: metric.userId } });
      if (!user) {
        console.log(`❌ Assignment Metric ID ${metric.id} references non-existent user ID ${metric.userId}`);
        assignmentMetricsIssues++;
      }
    }
    if (assignmentMetricsIssues === 0) {
      console.log('✅ All assignment metrics reference valid users');
    }

    // Check user_behavior_metrics table integrity
    const userBehaviorMetricsRepository = dataSource.getRepository(UserBehaviorMetric);
    const userBehaviorMetrics = await userBehaviorMetricsRepository.find();
    console.log(`\n📊 Checking ${userBehaviorMetrics.length} user behavior metrics for data integrity:`);
    let userBehaviorMetricsIssues = 0;
    for (const metric of userBehaviorMetrics) {
      const user = await dataSource.getRepository(User).findOne({ where: { id: metric.userId } });
      if (!user) {
        console.log(`❌ User Behavior Metric ID ${metric.id} references non-existent user ID ${metric.userId}`);
        userBehaviorMetricsIssues++;
      }
    }
    if (userBehaviorMetricsIssues === 0) {
      console.log('✅ All user behavior metrics reference valid users');
    }

    await dataSource.destroy();
    console.log('\n✅ Database connection closed');

    // Summary
    const totalIssues = workerIssues + serviceRequestIssues + waitlistIssues + assignmentMetricsIssues + userBehaviorMetricsIssues;
    if (totalIssues === 0) {
      console.log('\n🎉 Data integrity check passed! All user IDs are valid and reference existing users.');
    } else {
      console.log(`\n⚠️  Data integrity check found ${totalIssues} issues.`);
    }

  } catch (error) {
    console.error('❌ Error checking data integrity:', error);
  }
}

checkDataIntegrity();