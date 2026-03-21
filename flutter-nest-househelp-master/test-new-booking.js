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

  // Get test user (user 18)
  const userResult = await dataSource.query(`SELECT id FROM "user" WHERE email = 'test.user1@example.com'`);
  const userId = userResult[0].id;
  console.log('User ID:', userId);

  // Get COOK service
  const serviceResult = await dataSource.query(`SELECT id FROM service WHERE id = '165c758c-6e37-45a6-b194-6eb00a420dfd'`);
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

  // Trigger assignment
  console.log('\n🔄 Triggering assignment for booking:', bookingId);

  await dataSource.destroy();
}

createTestBooking().catch(console.error);
