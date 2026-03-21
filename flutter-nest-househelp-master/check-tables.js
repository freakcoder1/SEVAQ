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
    console.log('=== ALL TABLES IN DATABASE ===');
    const tables = await dataSource.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.table(tables);

    // Check booking table with proper case
    console.log('\n=== BOOKING TABLE DETAILS ===');
    const bookingCols = await dataSource.query(
      "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'booking' ORDER BY ordinal_position"
    );
    console.table(bookingCols);

    console.log('\n=== SAMPLE BOOKING ===');
    const booking = await dataSource.query("SELECT * FROM booking LIMIT 1");
    console.log(JSON.stringify(booking, null, 2));

    await dataSource.destroy();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Database error:', err.message);
    try { await dataSource.destroy(); } catch(e) {}
    process.exit(1);
  });
