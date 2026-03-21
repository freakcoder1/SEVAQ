// Simple script to create future bookings using raw SQL
const { Client } = require('pg');

// Generate a proper UUID v4
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createFutureBookings() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'sevaq_db',
    user: 'postgres',
    password: 'admin',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get current time
    const now = new Date();
    
    // Create bookings for the next 5 days at different times
    const futureDates = [
      { offsetHours: 2, name: '2 hours from now' },   // Within 24h window
      { offsetHours: 12, name: '12 hours from now' }, // Within 24h window
      { offsetHours: 26, name: '26 hours from now' }, // Outside 24h window
      { offsetHours: 48, name: '2 days from now' },
      { offsetHours: 96, name: '4 days from now' },
    ];

    const timeSlots = [
      { start: '08:00:00', end: '10:00:00' },
      { start: '10:00:00', end: '12:00:00' },
      { start: '14:00:00', end: '16:00:00' },
      { start: '16:00:00', end: '18:00:00' },
    ];

    // Get user ID for test.user1@example.com
    const userResult = await client.query(
      'SELECT id FROM "user" WHERE email = $1',
      ['test.user1@example.com']
    );
    
    if (userResult.rows.length === 0) {
      console.error('User not found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Found user ID: ${userId}`);

    // Get a worker and service
    const workerResult = await client.query('SELECT id FROM worker LIMIT 1');
    const serviceResult = await client.query('SELECT id FROM service LIMIT 1');
    
    if (workerResult.rows.length === 0 || serviceResult.rows.length === 0) {
      console.error('Worker or Service not found');
      return;
    }
    
    const workerId = workerResult.rows[0].id;
    const serviceId = serviceResult.rows[0].id;

    let createdCount = 0;
    
    for (const dateInfo of futureDates) {
      const bookingDate = new Date(now.getTime() + dateInfo.offsetHours * 60 * 60 * 1000);
      const dateStr = bookingDate.toISOString().split('T')[0];
      
      for (const slot of timeSlots) {
        // Check if booking already exists
        const checkResult = await client.query(
          `SELECT id FROM booking WHERE "userId" = $1 AND "date" = $2 AND "startTime" = $3`,
          [userId, dateStr, slot.start]
        );
        
        if (checkResult.rows.length > 0) {
          console.log(`Booking already exists for ${dateInfo.name} at ${slot.start}`);
          continue;
        }

        // Insert new booking with proper UUID
        await client.query(
          `INSERT INTO booking ("userId", "workerId", "serviceId", "date", "startTime", "endTime", "status", "isPaid", "totalAmount", "publicId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', true, 500, $7, NOW(), NOW())`,
          [
            userId, 
            workerId, 
            serviceId, 
            dateStr, 
            slot.start, 
            slot.end,
            uuidv4()
          ]
        );
        
        console.log(`Created booking: ${dateInfo.name} at ${slot.start}`);
        createdCount++;
      }
    }

    console.log(`\nTotal new bookings created: ${createdCount}`);
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  }
}

createFutureBookings();
