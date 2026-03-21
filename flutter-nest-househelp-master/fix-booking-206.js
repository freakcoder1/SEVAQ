const { DataSource } = require('typeorm');

async function fixBooking206() {
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

  // Update booking 206 location
  await dataSource.query(`
    UPDATE booking
    SET "customerLatitude" = 28.6139, "customerLongitude" = 77.2090
    WHERE id = 206
  `);
  console.log('✅ Updated booking 206 location to (28.6139, 77.2090)');

  // Trigger assignment via API
  console.log('\n🔄 Triggering assignment for booking 206...');

  try {
    const response = await fetch('http://localhost:45357/api/bookings/206/attempt-assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    console.log('Assignment result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('API Error:', error.message);
  }

  await dataSource.destroy();
}

fixBooking206().catch(console.error);
