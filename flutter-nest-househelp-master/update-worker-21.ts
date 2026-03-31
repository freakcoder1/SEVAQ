import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres.railway.internal',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'XYZsmjqpLzpwLMxDqebMOsNNNTkxthIE',
  database: process.env.DB_NAME || 'railway',
  synchronize: false,
});

async function main() {
  await dataSource.initialize();
  console.log('✅ Connected to Railway database');

  // 1. Update worker profile (ID 21 - Sumit)
  console.log('\n📝 Updating worker ID 21 profile...');
  
  const updateResult = await dataSource.query(`
    UPDATE worker SET 
      bio = 'Professional home cleaning services with 5+ years experience. Trusted by hundreds of happy customers in Greater Noida.',
      "serviceRadiusKm" = 25,
      "availabilitySchedule" = '[
        {"day":1,"startTime":"08:00","endTime":"20:00","isAvailable":true},
        {"day":2,"startTime":"08:00","endTime":"20:00","isAvailable":true},
        {"day":3,"startTime":"08:00","endTime":"20:00","isAvailable":true},
        {"day":4,"startTime":"08:00","endTime":"20:00","isAvailable":true},
        {"day":5,"startTime":"08:00","endTime":"20:00","isAvailable":true},
        {"day":6,"startTime":"09:00","endTime":"18:00","isAvailable":true},
        {"day":0,"startTime":"09:00","endTime":"18:00","isAvailable":true}
      ]',
      "yearsOfExperience" = 5,
      "isActive" = true
    WHERE id = 21
    RETURNING id, bio, "serviceRadiusKm", "availabilitySchedule"
  `);
  console.log('✅ Worker profile updated:', updateResult);

  // 2. Check bookings for worker 21
  console.log('\n📋 Checking bookings for worker ID 21...');
  
  const bookings = await dataSource.query(`
    SELECT id, status, date, "startTime", "endTime", "workerId", "assignedWorkerId", "customerName"
    FROM booking 
    WHERE "workerId" = 21 OR "assignedWorkerId" = 21
    ORDER BY date DESC, "startTime" DESC
    LIMIT 20
  `);
  console.log(`Found ${bookings.length} bookings for worker 21:`);
  console.log(JSON.stringify(bookings, null, 2));

  // 3. Also check all recent bookings to see what's happening
  console.log('\n📋 Checking recent confirmed bookings (any worker)...');
  const recentBookings = await dataSource.query(`
    SELECT id, status, date, "startTime", "endTime", "workerId", "assignedWorkerId", "customerName"
    FROM booking 
    WHERE status IN ('confirmed', 'pending')
    ORDER BY date DESC, "startTime" DESC
    LIMIT 10
  `);
  console.log(`Found ${recentBookings.length} recent bookings:`);
  console.log(JSON.stringify(recentBookings, null, 2));

  await dataSource.destroy();
  console.log('\n✅ Script completed');
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});