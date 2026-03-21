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
    console.log('=== USERS TABLE SCHEMA ===');
    const usersSchema = await dataSource.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
    );
    console.table(usersSchema);

    console.log('\n=== SUBSCRIPTIONS TABLE SCHEMA ===');
    const subsSchema = await dataSource.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subscriptions' ORDER BY ordinal_position"
    );
    console.table(subsSchema);

    console.log('\n=== Sample User IDs ===');
    const users = await dataSource.query("SELECT id, publicId, email FROM users LIMIT 3");
    console.table(users);

    console.log('\n=== Sample Subscription with userId ===');
    const subs = await dataSource.query("SELECT id, userId, status FROM subscriptions LIMIT 3");
    console.table(subs);

    await dataSource.destroy();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Database error:', err.message);
    try { await dataSource.destroy(); } catch(e) {}
    process.exit(1);
  });
