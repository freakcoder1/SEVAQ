require('dotenv').config();
const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'househelp',
});

dataSource.initialize()
  .then(async () => {
    // Check if subscription.userId (UUID) exists in user.publicId
    console.log('=== CHECKING UUID USER REFERENCE ===');
    const testUuid = 'd4fc9e66-be02-48c2-9c1d-1521bbd44b16';
    const user = await dataSource.query(
      'SELECT id, "publicId", email FROM "user" WHERE "publicId" = $1',
      [testUuid]
    );
    console.log('User with publicId =', testUuid, ':');
    console.table(user);

    // Check what bookings exist
    console.log('\n=== LATEST BOOKINGS ===');
    const bookings = await dataSource.query(
      'SELECT id, "userId", date, "startTime", "assignmentState" FROM booking ORDER BY id DESC LIMIT 5'
    );
    console.table(bookings);

    // Check if there are bookings for this userId
    console.log('\n=== CHECK IF BOOKINGS EXIST FOR INTEGER USER IDS ===');
    const userIds = bookings.map(b => b.userId);
    const users = await dataSource.query(
      `SELECT id, "publicId", email FROM "user" WHERE id = ANY($1)`,
      [userIds]
    );
    console.log('Users referenced in bookings:');
    console.table(users);

    await dataSource.destroy();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Database error:', err.message);
    try { await dataSource.destroy(); } catch(e) {}
    process.exit(1);
  });
