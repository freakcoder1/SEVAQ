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
    console.log('=== SAMPLE USERS ===');
    const users = await dataSource.query('SELECT id, "publicId", email FROM "user" LIMIT 3');
    console.table(users);

    console.log('\n=== SAMPLE SUBSCRIPTIONS WITH USER IDs ===');
    const subs = await dataSource.query('SELECT id, "userId", status FROM subscriptions LIMIT 3');
    console.table(subs);

    console.log('\n=== CROSS REFERENCE ===');
    // Show the relationship between subscription.userId (UUID) and user.publicId
    const joined = await dataSource.query(`
      SELECT s.id as subscription_id, s."userId" as subscription_userId_uuid,
             u.id as user_id, u."publicId" as user_publicId
      FROM subscriptions s
      JOIN "user" u ON s."userId"::text = u."publicId"
      LIMIT 3
    `);
    console.table(joined);

    console.log('\n=== SAMPLE BOOKING USER IDs ===');
    const bookings = await dataSource.query('SELECT id, "userId" FROM booking LIMIT 3');
    console.table(bookings);

    await dataSource.destroy();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Database error:', err.message);
    try { await dataSource.destroy(); } catch(e) {}
    process.exit(1);
  });
