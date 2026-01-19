require('dotenv').config();
const { Client } = require('pg');

async function createWorkersAndSlots() {
  const { v4: uuidv4 } = await import('uuid');
  console.log('🚀 Creating workers and time slots with enhanced location handling...');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sevaq_db',
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    return;
  }
  
  // Get user IDs for workers
  let users;
  try {
    const result = await client.query("SELECT id, email, \"firstName\", \"lastName\", latitude, longitude FROM \"user\" WHERE role = 'worker'");
    users = result.rows;
  } catch (error) {
    console.error('❌ Failed to fetch worker users:', error);
    await client.end();
    return;
  }

  if (users.length === 0) {
    console.log('❌ No worker users found');
    await client.end();
    return;
  }

  // Get service IDs
  let services;
  try {
    const result = await client.query("SELECT id FROM service");
    services = result.rows;
  } catch (error) {
    console.error('❌ Failed to fetch services:', error);
    await client.end();
    return;
  }

  if (services.length === 0) {
    console.log('❌ No services found');
    await client.end();
    return;
  }

  const workerData = [
    {
      userId: users[0]?.id,
      bio: 'Experienced housekeeping professional with 5 years of experience in residential cleaning.',
      rating: 4.8,
      reviewCount: 0,
      yearsOfExperience: 5,
      homesServedInArea: 85,
      reliabilityStreak: 15,
      isVerified: 1,
      isTrained: 1,
      isMonitored: 1,
      isActive: 1,
      // Primary location data
      latitude: 28.5805083,
      longitude: 77.4392111,
      // Current location (should match primary for seeded workers)
      currentLat: 28.5805083,
      currentLng: 77.4392111,
      microZoneId: 'Greater Noida - Alpha 1',
      serviceAreaId: 'Greater Noida',
      isAvailable: 1,
      lastLocationUpdate: new Date().toISOString(),
      serviceRadiusKm: 25, // Increased from 3 to 25km for better coverage
      availabilitySchedule: JSON.stringify([
        { day: 1, startTime: '08:00', endTime: '18:00' },
        { day: 2, startTime: '08:00', endTime: '18:00' },
        { day: 3, startTime: '08:00', endTime: '18:00' },
        { day: 4, startTime: '08:00', endTime: '18:00' },
        { day: 5, startTime: '08:00', endTime: '18:00' },
        { day: 6, startTime: '09:00', endTime: '17:00' },
        { day: 0, startTime: '10:00', endTime: '14:00' }
      ])
    },
    {
      userId: users[1]?.id,
      bio: 'Professional cook specializing in Indian and continental cuisine.',
      rating: 4.9,
      reviewCount: 0,
      yearsOfExperience: 8,
      homesServedInArea: 60,
      reliabilityStreak: 20,
      isVerified: 1,
      isTrained: 1,
      isMonitored: 1,
      isActive: 1,
      // Primary location data
      latitude: 28.5812345,
      longitude: 77.4389876,
      // Current location (should match primary for seeded workers)
      currentLat: 28.5812345,
      currentLng: 77.4389876,
      microZoneId: 'Greater Noida - Alpha 2',
      serviceAreaId: 'Greater Noida',
      isAvailable: 1,
      lastLocationUpdate: new Date().toISOString(),
      serviceRadiusKm: 25, // Increased from 2.5 to 25km for better coverage
      availabilitySchedule: JSON.stringify([
        { day: 1, startTime: '09:00', endTime: '19:00' },
        { day: 2, startTime: '09:00', endTime: '19:00' },
        { day: 3, startTime: '09:00', endTime: '19:00' },
        { day: 4, startTime: '09:00', endTime: '19:00' },
        { day: 5, startTime: '09:00', endTime: '19:00' },
        { day: 6, startTime: '10:00', endTime: '16:00' },
        { day: 0, startTime: '11:00', endTime: '15:00' }
      ])
    },
    {
      userId: users[2]?.id,
      bio: 'Multi-skilled professional offering both cleaning and cooking services.',
      rating: 4.7,
      reviewCount: 0,
      yearsOfExperience: 4,
      homesServedInArea: 55,
      reliabilityStreak: 12,
      isVerified: 1,
      isTrained: 1,
      isMonitored: 1,
      isActive: 1,
      // Primary location data
      latitude: 28.5798765,
      longitude: 77.4401234,
      // Current location (should match primary for seeded workers)
      currentLat: 28.5798765,
      currentLng: 77.4401234,
      microZoneId: 'Greater Noida - Beta',
      serviceAreaId: 'Greater Noida',
      isAvailable: 1,
      lastLocationUpdate: new Date().toISOString(),
      serviceRadiusKm: 25, // Increased from 3.5 to 25km for better coverage
      availabilitySchedule: JSON.stringify([
        { day: 1, startTime: '07:00', endTime: '17:00' },
        { day: 2, startTime: '07:00', endTime: '17:00' },
        { day: 3, startTime: '07:00', endTime: '17:00' },
        { day: 4, startTime: '07:00', endTime: '17:00' },
        { day: 5, startTime: '07:00', endTime: '17:00' },
        { day: 6, startTime: '08:00', endTime: '14:00' },
        { day: 0, startTime: '09:00', endTime: '13:00' }
      ])
    }
  ];

  for (let i = 0; i < Math.min(workerData.length, users.length); i++) {
    const worker = workerData[i];
    const user = users[i];
    
    try {
      // Check if worker already exists
      let existingWorker;
      try {
        const result = await client.query('SELECT id FROM worker WHERE "userId" = $1', [worker.userId]);
        existingWorker = result.rows[0];
      } catch (error) {
        console.error(`❌ Failed to check if worker exists for user ${user.firstName} ${user.lastName}:`, error);
        continue;
      }

      if (existingWorker) {
        console.log(`✅ Worker already exists: ${user.firstName} ${user.lastName}`);
        continue;
      }

      // Enhanced location validation
      if (!worker.latitude || !worker.longitude || !worker.currentLat || !worker.currentLng) {
        console.log(`⚠️ Worker ${user.firstName} ${user.lastName} has incomplete location data`);
        // Use user's location as fallback
        if (user.latitude && user.longitude) {
          worker.latitude = user.latitude;
          worker.longitude = user.longitude;
          worker.currentLat = user.latitude;
          worker.currentLng = user.longitude;
          console.log(`📍 Using user location for worker ${user.firstName} ${user.lastName}`);
        } else {
          console.log(`❌ Skipping worker ${user.firstName} ${user.lastName} - no location data available`);
          continue;
        }
      }

      // Create worker
      const workerId = uuidv4();
      try {
        await client.query(
          `INSERT INTO worker (id, "userId", bio, rating, "reviewCount", "yearsOfExperience", "homesServedInArea", "reliabilityStreak", "isVerified", "isTrained", "isMonitored", "isActive", latitude, longitude, "microZoneId", "serviceAreaId", "isAvailable", "currentLat", "currentLng", "lastLocationUpdate", "serviceRadiusKm", "availabilitySchedule", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())`,
          [
            workerId,
            worker.userId,
            worker.bio,
            worker.rating,
            worker.reviewCount,
            worker.yearsOfExperience,
            worker.homesServedInArea,
            worker.reliabilityStreak,
            worker.isVerified,
            worker.isTrained,
            worker.isMonitored,
            worker.isActive,
            worker.latitude,
            worker.longitude,
            worker.microZoneId,
            worker.serviceAreaId,
            worker.isAvailable,
            worker.currentLat,
            worker.currentLng,
            worker.lastLocationUpdate,
            worker.serviceRadiusKm,
            worker.availabilitySchedule
          ]
        );
        console.log(`✅ Created worker: ${user.firstName} ${user.lastName} with location: ${worker.currentLat}, ${worker.currentLng}`);
      } catch (error) {
        console.error(`❌ Failed to create worker ${user.firstName} ${user.lastName}:`, error);
        continue;
      }

      // Create worker-service relationships with validation
      let serviceCount = 0;
      for (const service of services) {
        try {
          await client.query(
            "INSERT INTO worker_services_service (worker_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [workerId, service.id]
          );
          serviceCount++;
        } catch (serviceError) {
          console.error(`❌ Error associating worker ${workerId} with service ${service.id}:`, serviceError);
        }
      }
      
      console.log(`🔗 Worker ${user.firstName} ${user.lastName} associated with ${serviceCount} services`);

      // Create time slots for next 7 days with 1-hour slots for better flexibility
      const today = new Date();
      let totalSlotsCreated = 0;
      
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);
        const dayOfWeek = currentDate.getDay();

        // Get availability for this day
        const availability = JSON.parse(worker.availabilitySchedule).find(avail => avail.day === dayOfWeek);
        if (!availability) continue;

        const [startHour] = availability.startTime.split(':').map(Number);
        const [endHour] = availability.endTime.split(':').map(Number);

        // Create 1-hour time slots for better flexibility (changed from 3-hour)
        for (let hour = startHour; hour < endHour; hour++) {
          const startTime = new Date(currentDate);
          startTime.setHours(hour, 0, 0, 0);

          const endTime = new Date(currentDate);
          endTime.setHours(hour + 1, 0, 0, 0);

          if (endTime > new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), endHour, 0, 0)) {
            break;
          }

          const slotId = uuidv4();
          try {
            await client.query(
              'INSERT INTO slot (id, "startTime", "endTime", "isBooked", "workerId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
              [
                slotId,
                startTime.toISOString(),
                endTime.toISOString(),
                false,
                workerId
              ]
            );
            totalSlotsCreated++;
          } catch (slotError) {
            console.error(`❌ Error creating slot for worker ${workerId}:`, slotError);
          }
        }
      }

      console.log(`✅ Created worker: ${user.firstName} ${user.lastName} with ${totalSlotsCreated} time slots (1-hour intervals)`);
    } catch (error) {
      console.error(`❌ Failed to create worker ${user.firstName} ${user.lastName}:`, error);
    }
  }

  await client.end();
  console.log('🎉 Enhanced worker and slot creation completed!');
}

createWorkersAndSlots().catch(console.error);