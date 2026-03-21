const { DataSource } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'sevaq_db',
});

async function generateBookingsForSubscription() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Get the subscription for user 18
    const subscription = await dataSource.query(`
      SELECT * FROM subscriptions WHERE "userId" = 18 AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1
    `);

    if (subscription.length === 0) {
      console.log('No active subscription found for user 18');
      return;
    }

    const sub = subscription[0];
    console.log('Found subscription:', sub.id, 'startDate:', sub.startDate);
    console.log('User ID:', sub.userId, 'Service Profile ID:', sub.serviceProfileId);

    // Get service profile details
    const serviceProfiles = await dataSource.query(`
      SELECT * FROM service_profiles WHERE id = $1
    `, [sub.serviceProfileId]);

    if (serviceProfiles.length === 0) {
      console.log('Service profile not found');
      return;
    }

    const serviceProfile = serviceProfiles[0];
    console.log('Service profile:', serviceProfile.name, 'price:', serviceProfile.price);

    // Get user details
    const users = await dataSource.query(`
      SELECT * FROM "user" WHERE id = $1
    `, [sub.userId]);

    console.log('User:', users[0]?.email);

    // Get an active worker
    const workers = await dataSource.query(`
      SELECT * FROM worker WHERE "isActive" = true AND "isAvailable" = true 
      ORDER BY rating DESC LIMIT 1
    `);

    const worker = workers[0];
    console.log('Found worker:', worker?.id);

    // Generate bookings for the next 7 days
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const bookings = [];
    const statuses = ['confirmed', 'requested'];

    for (let i = 0; i < 7; i++) {
      const bookingDate = new Date(startDate);
      bookingDate.setDate(bookingDate.getDate() + i);

      // Check if booking already exists for this date
      const existingBooking = await dataSource.query(`
        SELECT * FROM booking WHERE "userId" = $1 AND date = $2
      `, [sub.userId, bookingDate.toISOString().split('T')[0]]);

      if (existingBooking.length > 0) {
        console.log('Booking already exists for', bookingDate.toISOString().split('T')[0]);
        continue;
      }

      // Determine time window
      let startTime = '08:00:00';
      let endTime = '10:00:00';
      if (sub.preferredTimeWindow === 'AFTERNOON') {
        startTime = '14:00:00';
        endTime = '16:00:00';
      } else if (sub.preferredTimeWindow === 'EVENING') {
        startTime = '18:00:00';
        endTime = '20:00:00';
      }

      const totalAmount = 8000; // Default price since service profile doesn't have price field
      const publicId = uuidv4();

      // Create a new booking
      const bookingResult = await dataSource.query(`
        INSERT INTO booking (
          "publicId", "serviceRequestId", "userId", "workerId", "serviceId", "slotId",
          "startTime", "endTime", "date", "totalAmount", "isPaid", "status", "type",
          "notes", "responsibilityTransferred", "systemMonitoring", "protectionStatus",
          "assignmentState", "assignmentType", "assignmentExpiresAt", "assignmentStartsAt",
          "assignedWorkerId", "assignmentReason", "reassignmentCount", "assignmentTimestamp",
          "assignmentMetadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, now(), now()
        ) RETURNING id
      `, [
        publicId,
        null,
        sub.userId,
        worker?.id || null,
        serviceProfile.primaryServiceId || 1,
        null,
        startTime,
        endTime,
        bookingDate.toISOString().split('T')[0],
        totalAmount,
        false,
        'confirmed',
        'subscription',
        null,
        false,
        true,
        'protected',
        'assigned',
        'primary',
        null,
        bookingDate.toISOString(),
        worker?.id || null,
        'Auto-generated from subscription',
        0,
        bookingDate.toISOString(),
        JSON.stringify({ subscriptionId: sub.id, generatedAt: new Date().toISOString() }),
      ]);

      bookings.push({
        id: bookingResult[0]?.id,
        date: bookingDate.toISOString().split('T')[0],
        startTime,
        endTime,
        totalAmount,
        workerId: worker?.id,
      });

      console.log('Created booking', bookingResult[0]?.id, 'for', bookingDate.toISOString().split('T')[0]);
    }

    console.log('\n========================================');
    console.log('SUCCESS: Created', bookings.length, 'test bookings');
    console.log('========================================\n');

    await dataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

generateBookingsForSubscription();
