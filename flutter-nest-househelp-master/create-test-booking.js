const { DataSource } = require('typeorm');
const crypto = require('crypto');

async function createTestBooking() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'househelp',
    synchronize: false,
  });

  await dataSource.initialize();

  // Get or create test user
  let userResult = await dataSource.query(`SELECT id FROM "user" WHERE email = 'test.user1@example.com'`);
  let userId;

  if (userResult.length === 0) {
    // Create test user
    userId = crypto.randomUUID();
    await dataSource.query(`
      INSERT INTO "user" (id, email, password, "firstName", "lastName", role, latitude, longitude, "hasCompletedLocationSetup", "createdAt", "updatedAt")
      VALUES ($1, 'test.user1@example.com', '$2b$10$demo', 'Test', 'User', 'user', 28.6139, 77.2090, true, NOW(), NOW())
    `, [userId]);
    console.log('Created test user:', userId);
  } else {
    userId = userResult[0].id;
    // Update location
    await dataSource.query(`
      UPDATE "user" SET latitude = 28.6139, longitude = 77.2090, "hasCompletedLocationSetup" = true
      WHERE id = $1
    `, [userId]);
    console.log('Updated test user location:', userId);
  }

  // Get COOK service
  const serviceResult = await dataSource.query(`SELECT id FROM service LIMIT 1`);
  const serviceId = serviceResult[0].id;
  console.log('Service ID:', serviceId);

  // Create a new booking
  const bookingId = crypto.randomUUID();
  const publicId = `BK-${Date.now()}`;

  await dataSource.query(`
    INSERT INTO booking (id, "publicId", "userId", "serviceId", status, "customerLatitude", "customerLongitude", "serviceDate", "startTime", "endTime", "totalAmount", "paymentStatus", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, 'pending', 28.6139, 77.2090, '2026-02-04', '08:00:00', '10:00:00', 3500, 'pending', NOW(), NOW())
  `, [bookingId, publicId, userId, serviceId]);

  console.log('✅ Created booking:', publicId, bookingId);
  console.log('\n📋 Test with Flutter app:');
  console.log('   1. Log in as test.user1@example.com');
  console.log('   2. Create a subscription booking');
  console.log('   3. Assignment should find workers within 2.4km');

  await dataSource.destroy();
}

createTestBooking().catch(console.error);
