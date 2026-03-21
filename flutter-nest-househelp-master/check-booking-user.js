const { DataSource } = require('typeorm');

async function checkBookingAndUser() {
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

  // Get user columns
  const userCols = await dataSource.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'user'
  `);
  console.log('User columns:', JSON.stringify(userCols, null, 2));

  // Get recent bookings with user info
  const bookings = await dataSource.query(`
    SELECT b.id, b.status, b."assignmentstate", b."assignedworkerid",
           u."latitude", u."longitude", u."address"
    FROM booking b
    LEFT JOIN "user" u ON b."userId" = u.id
    ORDER BY b.id DESC
    LIMIT 5
  `);
  console.log('\nRecent bookings with user location:', JSON.stringify(bookings, null, 2));

  // Check service_requests table
  const srCols = await dataSource.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'service_requests'
  `);
  console.log('\nService requests columns:', JSON.stringify(srCols, null, 2));

  await dataSource.destroy();
}

checkBookingAndUser().catch(console.error);
