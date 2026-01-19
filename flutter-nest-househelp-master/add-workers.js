const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function addWorkers() {
  console.log('🚀 Adding workers to database...');
  console.log('[DEBUG] add-workers.js: Using PostgreSQL database for worker seeding');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sevaq_db',
  });

  await client.connect();
  
  // Get existing users who should be workers
  const users = [
    { email: 'amit.kumar@househelp.com', firstName: 'Amit', lastName: 'Kumar', bio: 'Experienced housekeeping professional with 5 years of experience in residential cleaning.', rating: 4.8, yearsOfExperience: 5, homesServedInArea: 85, reliabilityStreak: 15, latitude: 28.5805083, longitude: 77.4392111, microZoneId: 'Greater Noida - Alpha 1', serviceAreaId: 'Greater Noida', serviceRadiusKm: 3 },
    { email: 'priya.sharma@househelp.com', firstName: 'Priya', lastName: 'Sharma', bio: 'Professional cook specializing in Indian and continental cuisine.', rating: 4.9, yearsOfExperience: 8, homesServedInArea: 60, reliabilityStreak: 20, latitude: 28.5812345, longitude: 77.4389876, microZoneId: 'Greater Noida - Alpha 2', serviceAreaId: 'Greater Noida', serviceRadiusKm: 2.5 },
    { email: 'ramesh.kumar@example.com', firstName: 'Ramesh', lastName: 'Kumar', bio: 'Multi-skilled professional offering both cleaning and cooking services.', rating: 4.7, yearsOfExperience: 4, homesServedInArea: 55, reliabilityStreak: 12, latitude: 28.5798765, longitude: 77.4401234, microZoneId: 'Greater Noida - Beta', serviceAreaId: 'Greater Noida', serviceRadiusKm: 3.5 }
  ];

  for (const userData of users) {
    try {
      // Get user ID
      const userResult = await client.query('SELECT id FROM "user" WHERE email = $1', [userData.email]);
      const user = userResult.rows[0];

      if (!user) {
        console.log(`❌ User not found: ${userData.email}`);
        continue;
      }

      // Check if worker already exists
      const existingWorkerResult = await client.query('SELECT id FROM worker WHERE "userId" = $1', [user.id]);
      const existingWorker = existingWorkerResult.rows[0];

      if (existingWorker) {
        console.log(`✅ Worker already exists: ${userData.firstName} ${userData.lastName}`);
        continue;
      }

      // Create worker
      const workerData = {
        userId: user.id,
        bio: userData.bio,
        rating: userData.rating,
        reviewCount: 0,
        yearsOfExperience: userData.yearsOfExperience,
        homesServedInArea: userData.homesServedInArea,
        reliabilityStreak: userData.reliabilityStreak,
        isVerified: 1,
        isTrained: 1,
        isMonitored: 1,
        isActive: 1,
        latitude: userData.latitude,
        longitude: userData.longitude,
        microZoneId: userData.microZoneId,
        serviceAreaId: userData.serviceAreaId,
        isAvailable: 1,
        currentLat: userData.latitude,
        currentLng: userData.longitude,
        lastLocationUpdate: new Date().toISOString(),
        serviceRadiusKm: userData.serviceRadiusKm,
        availabilitySchedule: JSON.stringify([
          { day: 1, startTime: '08:00', endTime: '18:00' },
          { day: 2, startTime: '08:00', endTime: '18:00' },
          { day: 3, startTime: '08:00', endTime: '18:00' },
          { day: 4, startTime: '08:00', endTime: '18:00' },
          { day: 5, startTime: '08:00', endTime: '18:00' },
          { day: 6, startTime: '09:00', endTime: '17:00' },
          { day: 0, startTime: '10:00', endTime: '14:00' }
        ]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await client.query(`INSERT INTO worker ("userId", bio, rating, "reviewCount", "yearsOfExperience", "homesServedInArea", "reliabilityStreak", "isVerified", "isTrained", "isMonitored", "isActive", latitude, longitude, "microZoneId", "serviceAreaId", "isAvailable", "currentLat", "currentLng", "lastLocationUpdate", "serviceRadiusKm", "availabilitySchedule", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
        Object.values(workerData));

      console.log(`✅ Created worker: ${userData.firstName} ${userData.lastName}`);
    } catch (error) {
      console.error(`❌ Failed to create worker ${userData.firstName} ${userData.lastName}:`, error);
    }
  }

  await client.end();
  console.log('🎉 Worker creation completed!');
}

addWorkers().catch(console.error);