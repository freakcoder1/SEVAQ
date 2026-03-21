require('dotenv').config();
const { DataSource } = require('typeorm');

console.log('Checking database connection...');

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
    console.log('Connected successfully');

    // Check booking table schema
    const result = await dataSource.query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'booking' ORDER BY ordinal_position"
    );
    console.log('\n=== BOOKING TABLE SCHEMA ===');
    console.table(result);

    // Check if there's a booking record
    const count = await dataSource.query("SELECT COUNT(*) as count FROM booking");
    console.log('\nBooking count:', count[0].count);

    await dataSource.destroy();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Database error:', err.message);
    try { await dataSource.destroy(); } catch(e) {}
    process.exit(1);
  });
