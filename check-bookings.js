const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'sevaq'
});

async function checkBookings() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Check all bookings for user 18
    const result = await client.query(`
      SELECT id, status, date, "startTime" 
      FROM bookings 
      WHERE "userId" = 18 
      ORDER BY date DESC, "startTime" DESC
    `);

    console.log('Bookings for user 18:');
    result.rows.forEach(row => {
      console.log(`
        ID: ${row.id}
        Status: ${row.status}
        Date: ${row.date}
        Start Time: ${row.starttime}
      `);
    });

    // Check current time
    const now = new Date();
    console.log(`\nCurrent time: ${now.toISOString()}`);

    // Check if any bookings are upcoming for user 18
    console.log('\nUpcoming bookings for user 18:');
    const upcomingResult = await client.query(`
      SELECT id, status, date, "startTime" 
      FROM bookings 
      WHERE "userId" = 18 
        AND (status = 'confirmed' OR status = 'requested')
        AND (date > CURRENT_DATE OR (date = CURRENT_DATE AND "startTime" > CURRENT_TIME))
      ORDER BY date ASC, "startTime" ASC
    `);

    upcomingResult.rows.forEach(row => {
      console.log(`
        ID: ${row.id}
        Status: ${row.status}
        Date: ${row.date}
        Start Time: ${row.starttime}
      `);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkBookings();
