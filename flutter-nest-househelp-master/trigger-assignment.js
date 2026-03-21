const { DataSource } = require('typeorm');
const axios = require('axios');

async function triggerAssignment() {
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

  // Get pending bookings with user location
  const bookings = await dataSource.query(`
    SELECT b.id, b.status, b."assignmentstate", u.email, u.latitude, u.longitude
    FROM booking b
    LEFT JOIN "user" u ON b."userId" = u.id
    WHERE b.status IN ('pending', 'PENDING')
    AND b."assignmentstate" = 'pending'
    LIMIT 3
  `);
  console.log('Pending bookings:');
  bookings.forEach(b => {
    console.log(`  ${b.id.substring(0, 8)}: ${b.email}, lat=${b.latitude}, lng=${b.longitude}, state=${b.assignmentstate}`);
  });

  if (bookings.length > 0) {
    const bookingId = bookings[0].id;
    console.log(`\n🔄 Triggering assignment for booking ${bookingId.substring(0, 8)}...`);

    try {
      // Call the assignment trigger endpoint
      const response = await axios.post('http://127.0.0.1:45357/api/assignments/attempt-assignment', {
        bookingId: bookingId
      });
      console.log('✅ Assignment triggered successfully!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error triggering assignment:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }
  } else {
    console.log('\n⚠️ No pending bookings found');
  }

  await dataSource.destroy();
}

triggerAssignment().catch(console.error);
