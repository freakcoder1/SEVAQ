const { DataSource } = require('typeorm');

async function checkAndFixBooking() {
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

  // Get booking columns
  const cols = await dataSource.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'booking'
  `);
  console.log('Booking columns:', JSON.stringify(cols, null, 2));

  // Get recent bookings
  const bookings = await dataSource.query(`
    SELECT id, "customerLatitude", "customerLongitude", status
    FROM booking
    ORDER BY id DESC
    LIMIT 5
  `);
  console.log('\nRecent bookings:', JSON.stringify(bookings, null, 2));

  // Update first booking (oldest) with location
  if (bookings.length > 0 && bookings[0].customerLatitude === null) {
    const bookingId = bookings[0].id;
    await dataSource.query(`
      UPDATE booking
      SET "customerLatitude" = 28.6139, "customerLongitude" = 77.2090
      WHERE id = $1
    `, [bookingId]);
    console.log('\n✅ Updated booking', bookingId.substring(0, 8), 'location to (28.6139, 77.2090)');

    // Trigger assignment
    console.log('🔄 Triggering assignment...');
  }

  await dataSource.destroy();
}

checkAndFixBooking().catch(console.error);
